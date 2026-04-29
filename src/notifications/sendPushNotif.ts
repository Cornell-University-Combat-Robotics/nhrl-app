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
  console.log(`[push] sending batch of ${messages.length} message(s) to Expo`);
  console.log('[push] target tokens:', messages.map(m => maskToken(m.to)));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if(!response.ok) {
    console.error('[push] HTTP error from Expo:', response.status, response.statusText);
  }

  const json = await response.json();

  //log per-ticket result so we can see DeviceNotRegistered, MessageRateExceeded, etc.
  if (Array.isArray(json?.data)) {
    json.data.forEach((ticket: any, i: number) => {
      const to = maskToken(messages[i]?.to ?? '');
      if (ticket.status === 'ok') {
        console.log(`[push] OK -> ${to} (id=${ticket.id})`);
      } else {
        console.warn(`[push] NOT OK -> ${to}`, ticket);
      }
    });
  } else if (json?.errors) {
    console.error('[push] Expo returned errors:', json.errors);
  }

  return json;
}

/** Mask middle of expo token to avoid noisy logs while still being identifiable. */
function maskToken(t: string): string {
  if (!t) return '<empty>';
  if (t.length <= 14) return t;
  return `${t.slice(0, 18)}...${t.slice(-4)}`;
}

/**
 * Sends `title`/`msg` only to users tracking `robotId`.
 *
 * Uses the `get_push_tokens_for_robot` SQL function (SECURITY DEFINER) so that even
 * when called from a regular user's authenticated client, RLS does not hide other
 * users' tracker rows / push tokens. Without this, phone A's session would only see
 * its own tracking row and never notify phone B.
 *
 * No-op if `robotId` is missing or no trackers have a push token.
 */
  export async function editFightNotifBroadcast(
    title: string,
    msg: string,
    robotId: number | undefined,
    supabaseClient: SupabaseClientType
  ) {
    console.log(`[push] editFightNotifBroadcast START -> title="${title}" robotId=${robotId}`);

    if (robotId == null) {
      console.warn('[push] missing robotId; skipping push.');
      return;
    }

    //fetch push tokens for all users tracking this robot via SECURITY DEFINER RPC
    const { data: tokenRows, error } = await supabaseClient.rpc(
      'get_push_tokens_for_robot',
      { target_robot_id: robotId }
    );

    if (error) {
      console.error('[push] Error calling get_push_tokens_for_robot:', error);
      return;
    }

    const tokens: string[] = ((tokenRows as { expo_push_token: string | null }[] | null) ?? [])
      .map((r) => r.expo_push_token)
      .filter((t): t is string => !!t);

    console.log(`[push] ${tokens.length} token(s) found for robot_id=${robotId}:`, tokens.map(maskToken));

    if (tokens.length === 0) {
      console.log('[push] no recipients with valid tokens; nothing to send.');
      return;
    }

    const messages: { to: string; title: string; body: string }[] = tokens.map((to) => ({
      to,
      title,
      body: msg,
    }));

    for (const batch of chunk(messages, EXPO_BATCH_SIZE)) {
      await sendPushBatch(batch);
    }

    console.log(`[push] editFightNotifBroadcast DONE -> title="${title}" robotId=${robotId}`);
  }

/**
 * Sends `title`/`msg` to ALL users with a push token, regardless of tracked robots.
 *
 * Uses the `get_all_push_tokens` SQL function (SECURITY DEFINER) so that an
 * authenticated admin client can read every user's token despite RLS.
 *
 * Intended for one-off admin announcements (see `app/(admin)/notification-form.tsx`).
 */
export async function sendCustomBroadcast(
  title: string,
  msg: string,
  supabaseClient: SupabaseClientType
) {
  console.log(`[push] sendCustomBroadcast START -> title="${title}"`);

  const { data: tokenRows, error } = await supabaseClient.rpc('get_all_push_tokens');

  if (error) {
    console.error('[push] Error calling get_all_push_tokens:', error);
    throw error;
  }

  const tokens: string[] = ((tokenRows as { expo_push_token: string | null }[] | null) ?? [])
    .map((r) => r.expo_push_token)
    .filter((t): t is string => !!t);

  console.log(`[push] ${tokens.length} token(s) found for broadcast:`, tokens.map(maskToken));

  if (tokens.length === 0) {
    console.log('[push] no recipients with valid tokens; nothing to send.');
    return;
  }

  const messages: { to: string; title: string; body: string }[] = tokens.map((to) => ({
    to,
    title,
    body: msg,
  }));

  for (const batch of chunk(messages, EXPO_BATCH_SIZE)) {
    await sendPushBatch(batch);
  }

  console.log(`[push] sendCustomBroadcast DONE -> title="${title}"`);
}
