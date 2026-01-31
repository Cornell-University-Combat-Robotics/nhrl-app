import { SupabaseClient } from '@supabase/supabase-js';
import type { Fight } from '../db/fights.ts';

/**
 * Purpose: Sends push notification to a single device
 */
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

export async function createFightNotifBroadcast(
    createdFight: Fight,
    supabaseClient: SupabaseClient
  ) {
    const msg = `${createdFight.robot_name ?? 'Robot'} vs ${createdFight.opponent_name} scheduled for ${createdFight.fight_time ? createdFight.fight_time : 'TBD'} at Cage ${createdFight.cage ?? '?'}.`;
    editFightNotifBroadcast('New Fight', msg, supabaseClient);
  }

//TODO: make more informative?
export async function updateFightNotifBroadcast(
    updatedFight: Fight,
    supabaseClient: SupabaseClient
  ) {
    const msg = `${updatedFight.robot_name ?? 'Robot'} vs ${updatedFight.opponent_name} scheduled for ${updatedFight.fight_time ? updatedFight.fight_time : 'TBD'} at Cage ${updatedFight.cage ?? '?'}.`;
    editFightNotifBroadcast('Updated Fight', msg, supabaseClient);
  }

//TODO: need for delete fight?
/**
 * Purpose: Sends push notif to ALL users when any fight edit is made (e.g. insert, update, delete)
 */
  export async function editFightNotifBroadcast(
    title: string,
    msg: string,
    supabaseClient: SupabaseClient
  ) {
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('id, expo_push_token')
      .not('expo_push_token', 'is', null);
  
    if (error) {
      console.error('Error fetching push tokens for broadcast:', error);
      return;
    }
  
    for (const p of profiles ?? []) {
      if (p.expo_push_token) {
        sendPushNotification(p.expo_push_token, title, msg);
      }
    }
  }
