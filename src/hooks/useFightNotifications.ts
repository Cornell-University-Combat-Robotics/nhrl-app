import { useAuth } from "@/src/contexts/AuthContext";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { supabase } from "../supabaseClient";

/**
 * Shape of a row from the `fights` table as delivered in a Realtime payload.
 * Only the columns we read for notification logic are listed.
 */
type FightRow = {
  fight_id: number;
  robot_id: number | null;
  robot_name: string | null;
  opponent_name: string | null;
  cage: number | null;
  fight_time: string | null;
  is_win: "win" | "lose" | null;
  outcome_type: string | null;
};

/**
 * Subscribe to Realtime changes on `public.fights` and fire LOCAL push notifications
 * for the signed-in user when one of their tracked robots has a fight that:
 *  - is newly inserted -> "New Fight"
 *  - has `is_win` transition NULL -> non-null -> "Fight Result"
 *  - has fight_time/cage changed while still incomplete -> "Updated Fight"
 *
 * Why this exists: server-side push (in `sendPushNotif.ts`) only fires from app
 * code paths (admin form, scrapers). Manual edits in Supabase Studio bypass that
 * code, so they never trigger pushes. Realtime catches DB-level changes from any
 * source -- but only while the app is foregrounded (the WebSocket disconnects
 * when backgrounded long enough).
 *
 * NOTE: this can dupe with server-side push when the change came from an in-app
 * code path -- the server-side push is delivered AND realtime fires a local
 * notification. Acceptable trade-off for catching manual DB edits; revisit if
 * dupes get noisy.
 */
export function useFightNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("fights-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fights" },
        (payload) => handleFightInsert(payload.new as FightRow, user.id),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "fights" },
        (payload) =>
          handleFightUpdate(
            payload.old as FightRow,
            payload.new as FightRow,
            user.id,
          ),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[realtime-notif] subscribed to fights changes for user", user.id);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}

/** Returns true if the signed-in user is tracking the robot with `robotId`. */
async function userTracksRobot(userId: string, robotId: number | null): Promise<boolean> {
  if (robotId == null) return false;
  const { data, error } = await supabase
    .from("profile_tracked_robots")
    .select("robot_id")
    .eq("profile_id", userId)
    .eq("robot_id", robotId)
    .maybeSingle();
  if (error) {
    console.error("[realtime-notif] track-check error:", error);
    return false;
  }
  return !!data;
}

/** Fires immediately as a local OS notification (no remote push involved). */
async function showLocal(title: string, body: string) {
  console.log(`[realtime-notif] showing local notif -> "${title}": ${body}`);
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

async function handleFightInsert(fight: FightRow, userId: string) {
  if (!(await userTracksRobot(userId, fight.robot_id))) return;

  await showLocal(
    "New Fight",
    `${fight.robot_name ?? "Robot"} vs ${fight.opponent_name ?? "unknown"} scheduled for ${fight.fight_time ?? "TBD"} at Cage ${fight.cage ?? "?"}.`,
  );
}

async function handleFightUpdate(
  oldFight: FightRow,
  newFight: FightRow,
  userId: string,
) {
  if (!(await userTracksRobot(userId, newFight.robot_id))) return;

  //is_win NULL -> non-null = fight just concluded -> Fight Result notif
  const isWinTransition = oldFight.is_win == null && newFight.is_win != null;
  //schedule changes while still incomplete -> Updated Fight notif
  const wasAlreadyComplete = oldFight.is_win != null;
  const scheduleChanged =
    oldFight.fight_time !== newFight.fight_time || oldFight.cage !== newFight.cage;

  if (isWinTransition) {
    const result = newFight.is_win === "win" ? "WIN!" : "LOSS";
    const outcome = newFight.outcome_type ? ` (${newFight.outcome_type})` : "";
    await showLocal(
      "Fight Result",
      `Fight Result: ${newFight.robot_name ?? "Robot"} vs ${newFight.opponent_name ?? "unknown"} - ${result}${outcome}`,
    );
  } else if (!wasAlreadyComplete && scheduleChanged) {
    await showLocal(
      "Updated Fight",
      `${newFight.robot_name ?? "Robot"} vs ${newFight.opponent_name ?? "unknown"} scheduled for ${newFight.fight_time ?? "TBD"} at Cage ${newFight.cage ?? "?"}.`,
    );
  }
}
