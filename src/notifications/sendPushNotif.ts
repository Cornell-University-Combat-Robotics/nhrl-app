import pkg from '@supabase/supabase-js';
import type { Fight } from '../db/fights.ts';

/** Type-only so this file works in both Node (scraper) and Expo; Node ESM doesn't expose named exports from CJS. */
type SupabaseClientType = import('@supabase/supabase-js').SupabaseClient;

/** Sends one push to Expo; token = target device. Returns Expo API JSON; logs on !response.ok. */
export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
    const message = {
        to: expoPushToken, //target device, not shown to user
        title,
        body
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });

    if(!response.ok) {
        console.error('Failed to send push notification:', response.statusText);
    }

    const result = await response.json();
    return result
}

/** Broadcast "New Fight" to all profiles with expo_push_token (fight time, cage, opponents). */
export async function createFightNotifBroadcast(
    createdFight: Fight,
    supabaseClient: SupabaseClientType
  ) {
    const msg = `${createdFight.robot_name ?? 'Robot'} vs ${createdFight.opponent_name} scheduled for ${createdFight.fight_time ? createdFight.fight_time : 'TBD'} at Cage ${createdFight.cage ?? '?'}.`;
    await editFightNotifBroadcast('New Fight', msg, supabaseClient);
  }

/** Broadcast "Fight Result" (if isWinUpdate) or "Updated Fight"; uses same client to fetch profiles. */
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
      await editFightNotifBroadcast('Fight Result', msg, supabaseClient);
    } else {
      const msg = `${robotName} vs ${opponentName} scheduled for ${updatedFight.fight_time ? updatedFight.fight_time : 'TBD'} at Cage ${updatedFight.cage ?? '?'}.`;
      await editFightNotifBroadcast('Updated Fight', msg, supabaseClient);
    } 
  }

type ProfilePushRow = { id: string; expo_push_token: string | null };

/** Fetches all profiles with expo_push_token, sends one push per profile (title + msg). Used by create/update broadcast. */
  export async function editFightNotifBroadcast(
    title: string,
    msg: string,
    supabaseClient: SupabaseClientType
  ) {
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('id, expo_push_token')
      .not('expo_push_token', 'is', null);
  
    if (error) {
      console.error('Error fetching push tokens for broadcast:', error);
      return;
    }
  
    for (const p of (profiles ?? []) as ProfilePushRow[]) {
      if (p.expo_push_token) {
        await sendPushNotification(p.expo_push_token, title, msg);
      }
    }
  }
