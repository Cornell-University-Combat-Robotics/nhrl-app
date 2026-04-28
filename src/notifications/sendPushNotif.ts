import pkg from '@supabase/supabase-js';
import type { Fight } from '../db/fights.ts';

/** Type-only so this file works in both Node (scraper) and Expo; Node ESM doesn't expose named exports from CJS. */
type SupabaseClientType = import('@supabase/supabase-js').SupabaseClient;

/** Max number of pushes to send in one batch to Expo. (expo limits this) */
const EXPO_BATCH_SIZE = 100;

/** Notify "New Fight" to users tracking this robot only. */
export async function createFightNotifBroadcast(
    createdFight: Fight,
    supabaseClient: SupabaseClientType
  ) {
    const msg = `${createdFight.robot_name ?? 'Robot'} vs ${createdFight.opponent_name} scheduled for ${createdFight.fight_time ? createdFight.fight_time : 'TBD'} at Cage ${createdFight.cage ?? '?'}.`;
    await editFightNotifBroadcast('New Fight', msg, createdFight.robot_id, supabaseClient);
  }

/** Notify "Fight Result"/"Updated Fight" to users tracking this robot only. */
export async function updateFightNotifBroadcast(
    updatedFight: Fight,
    supabaseClient: SupabaseClientType,
    options?: { isWinUpdate?: boolean }
  ) {
    const robotName = updatedFight.robot_name ?? 'Robot';
    const opponentName = updatedFight.opponent_name ?? 'unknown';

    if (options?.isWinUpdate) {
      const result = (updatedFight.is_win === 'win') ? 'WIN!' : 'LOSS';
      const outcome = updatedFight.outcome_type ? ` (${updatedFight.outcome_type})` : '';
      const msg = `Fight Result: ${robotName} vs ${opponentName} - ${result}${outcome}`;
      await editFightNotifBroadcast('Fight Result', msg, updatedFight.robot_id, supabaseClient);
    } else {
      const msg = `${robotName} vs ${opponentName} scheduled for ${updatedFight.fight_time ? updatedFight.fight_time : 'TBD'} at Cage ${updatedFight.cage ?? '?'}.`;
      await editFightNotifBroadcast('Updated Fight', msg, updatedFight.robot_id, supabaseClient);
    } 
  }

/** Split array into chunks of size n. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/** Sends a batch (100 == EXPO_BATCH_SIZE) of messages in one POST. 
 * 
 * Note: This implementation is much more efficient than looping through each expo push token & 
 * sending one push per profile. 
 * - Loop does 1 fetch request per user (meaning 100 users == 100 requests)
 * - Batch does 1 fetch requset per 100 users (meaning 100 users == 1 request) --> 1 fetch whose body is a JSON array of 100 message objcets
 * 
 * @param messages - array of objects (messages) with properties "to", "title", "body"
 * @returns Expo API JSON
*/
async function sendPushBatch(messages: { to: string, title: string, body: string }[]) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if(!response.ok) {
    console.error('Failed to send push notification:', response.statusText);
  }

  return response.json();
}

/**
 * Sends `title`/`msg` only to users tracking `robotId` (via `profile_tracked_robots` join table).
 * No-op if `robotId` is missing or no trackers have a push token.
 */
  export async function editFightNotifBroadcast(
    title: string,
    msg: string,
    robotId: number | undefined,
    supabaseClient: SupabaseClientType
  ) {
    if (robotId == null) {
      console.warn('editFightNotifBroadcast: missing robotId; skipping push.');
      return;
    }

    //find all profile_ids tracking this robot
    const { data: tracked, error: trackedErr } = await supabaseClient
      .from('profile_tracked_robots')
      .select('profile_id')
      .eq('robot_id', robotId);

    if (trackedErr) {
      console.error('Error fetching trackers for robot:', trackedErr);
      return;
    }

    const profileIds = (tracked ?? []).map((t: { profile_id: string }) => t.profile_id);
    if (profileIds.length === 0) return;

    //fetch push tokens for those profiles
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('expo_push_token')
      .in('id', profileIds)
      .not('expo_push_token', 'is', null)
      .neq('expo_push_token', '');

    if (error) {
      console.error('Error fetching push tokens for tracked recipients:', error);
      return;
    }

    const messages = (profiles ?? []).map((p) => ({
      to: p.expo_push_token,
      title,
      body: msg,
    }));

    for (const batch of chunk(messages, EXPO_BATCH_SIZE)) {
      await sendPushBatch(batch);
    }
  }
