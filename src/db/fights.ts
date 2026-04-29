/** DB access for fights table; createFight triggers push notifications. */
import {
  createFightNotifBroadcast,
  updateFightNotifBroadcast,
} from "../notifications/sendPushNotif";
import { supabase } from "../supabaseClient";

export interface Fight {
  fight_id?: number;
  robot_name?: string;
  robot_id?: number;
  opponent_name?: string;
  cage?: number | null;
  fight_time?: string | null;
  last_updated?: string;
  is_win?: "win" | "lose" | null;
  fight_duration?: number;
  outcome_type?: "TO" | "KO" | "JD" | null;
  competition?: string;
}

/** All fights with robot join; order by fight_time desc, fight_id desc. */
export async function getAllFights() {
  const { data, error } = await supabase
    .from("fights")
    .select("*, robots!robot_id(robot_name, robot_id)")
    .order("fight_time", { ascending: false, nullsFirst: true })
    .order("fight_id", { ascending: false });

  if (error) throw error;
  return data;
}

/** Single fight by id (with robot). */
export async function getFightById(fightId: number) {
  const { data, error } = await supabase
    .from("fights")
    .select("*, robots!robot_id(robot_name, robot_id)")
    .eq("fight_id", fightId)
    .single();

  if (error) throw error;
  return data;
}

/** Fights for one robot; order by fight_id desc. */
export async function getFightsByRobotId(robotId: number) {
  const { data, error } = await supabase
    .from("fights")
    .select("*")
    .eq("robot_id", robotId)
    .order("fight_id", { ascending: false });

  if (error) throw error;
  return data;
}

/** Insert or update by (robot_name, opponent_name, competition); sends create/update push notif. Resolves robot_name from robot_id if needed. */
export async function createFight(fight: Fight) {
  // Get current time in HH:MM:SS format
  const now = new Date().toTimeString().split(" ")[0];

  // Fetch robot name from robots table if not provided
  let robotName = fight.robot_name;
  if (!robotName) {
    const { data: robotData, error: robotError } = await supabase
      .from("robots")
      .select("robot_name")
      .eq("robot_id", fight.robot_id)
      .single();

    if (robotError) throw robotError;
    robotName = robotData?.robot_name || "";
  }

  const fightData = {
    ...fight,
    fight_time: fight.fight_time === "" ? null : (fight.fight_time ?? null),
    is_win: fight.is_win ?? null,
    outcome_type: fight.outcome_type ?? null,
    robot_name: robotName,
    last_updated: now,
  };

  //essentially the same as upsert, but expanded out to allow for different notification types
  //check if fight already exists
  const { data, error } = await supabase
    .from("fights")
    .select("fight_id, is_win, fight_time, cage")
    .eq("robot_name", robotName)
    .eq("opponent_name", fight.opponent_name)
    .eq("competition", fight.competition)
    .maybeSingle(); //maybeSingle because we don't know if the fight exists yet

  if (error) throw error;
  if (data) {
    //fight already exists -> update + maybe notify
    const { error: updateError } = await supabase
      .from("fights")
      .update(fightData)
      .eq("fight_id", data.fight_id);
    if (updateError) throw updateError;

    //is_win NULL -> non-null = fight result is in -> Fight Result notif
    const isWinTransition = data.is_win == null && fightData.is_win != null;
    //schedule changes (only if fight wasn't already complete) -> Updated Fight notif
    const wasAlreadyComplete = data.is_win != null;
    const scheduleChanged =
      data.fight_time !== fightData.fight_time || data.cage !== fightData.cage;

    if (isWinTransition) {
      await updateFightNotifBroadcast(fightData, supabase, { isWinUpdate: true });
    } else if (!wasAlreadyComplete && scheduleChanged) {
      await updateFightNotifBroadcast(fightData, supabase, { isWinUpdate: false });
    }
    return data;
  } else {
    //fight doesn't exist yet, so create new one
    const { error: insertError } = await supabase
      .from("fights")
      .insert(fightData);
    if (insertError) throw insertError;
    await createFightNotifBroadcast(fightData, supabase);
    return data;
  }
}

/**
 * Update an existing fight by fight_id.
 *
 * Fires push notifications (filtered to users tracking the robot) when:
 *  - `is_win` transitions from NULL -> non-null (fight just concluded) -> "Fight Result"
 *  - `fight_time` or `cage` changed while still incomplete -> "Updated Fight"
 *
 * Same filtering as `createFight` and the scrapers.
 */
export async function updateFight(fightId: number, fight: Partial<Fight>) {
  // Get current time in HH:MM:SS format
  const now = new Date().toTimeString().split(" ")[0];

  //fetch existing row first so we can detect transitions for notifications
  const { data: existing, error: existingErr } = await supabase
    .from("fights")
    .select("*")
    .eq("fight_id", fightId)
    .single();
  if (existingErr) {
    console.error("Fetch existing fight error:", existingErr);
    throw existingErr;
  }

  const fightData = {
    ...fight,
    fight_time: fight.fight_time === "" ? null : fight.fight_time,
    last_updated: now,
  };

  // Remove undefined values
  const cleanData = Object.fromEntries(
    Object.entries(fightData).filter(([_, v]) => v !== undefined)
  );

  // Perform the update
  const { error } = await supabase
    .from("fights")
    .update(cleanData)
    .eq("fight_id", fightId);

  if (error) {
    console.error("Update error:", error);
    throw error;
  }

  // Fetch the updated record
  const { data, error: fetchError } = await supabase
    .from("fights")
    .select("*")
    .eq("fight_id", fightId)
    .single();

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    throw fetchError;
  }

  //decide notification type based on (existing -> updated) transition
  const isWinTransition = existing.is_win == null && data.is_win != null;
  const wasAlreadyComplete = existing.is_win != null;
  const scheduleChanged =
    existing.fight_time !== data.fight_time || existing.cage !== data.cage;

  if (isWinTransition) {
    await updateFightNotifBroadcast(data, supabase, { isWinUpdate: true });
  } else if (!wasAlreadyComplete && scheduleChanged) {
    await updateFightNotifBroadcast(data, supabase, { isWinUpdate: false });
  }

  return data;
}

/** Delete fight by id. */
export async function deleteFight(fightId: number) {
  const { error } = await supabase
    .from("fights")
    .delete()
    .eq("fight_id", fightId);

  if (error) throw error;
}
