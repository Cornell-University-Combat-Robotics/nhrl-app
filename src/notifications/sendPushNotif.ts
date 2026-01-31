import { SupabaseClient } from '@supabase/supabase-js';
import type { Fight } from '../db/fights.ts';
import { supabase } from '../supabaseClient.ts';

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

/**
 * Purpose: Sends push notif to ALL users when a new fight is created
 */
export async function createFightNotifBroadcast(
    createdFight: Fight,
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
  
    const msg = `${createdFight.robot_name ?? 'Robot'} vs ${createdFight.opponent_name} scheduled for ${createdFight.fight_time ? createdFight.fight_time : 'TBD'} at Cage ${createdFight.cage ?? '?'}.`;
  
    for (const p of profiles ?? []) {
      if (p.expo_push_token) {
        sendPushNotification(p.expo_push_token, 'New Fight', msg);
      }
    }
  }
