import { supabase } from '../supabaseClient.ts';

export interface Fight {
  fight_id?: number;
  robot_name: string;
  robot_id: number;
  opponent_name: string;
  cage?: number;
  fight_time?: string;
  last_updated?: number;
  is_win: string | null; // '1' or '0' or null
  fight_duration?: number;
  outcome_type?: 'KO' | 'Judges Decision' | 'Tapout';
}

export async function getAllFights() {
  const { data, error } = await supabase
    .from('fights')
    .select('*, robots!robot_id(robot_name, robot_id)')
    .order('fight_id', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getFightById(fightId: number) {
  const { data, error } = await supabase
    .from('fights')
    .select('*, robots!robot_id(robot_name, robot_id)')
    .eq('fight_id', fightId)
    .single();

  if (error) throw error;
  return data;
}

export async function getFightsByRobotId(robotId: number) {
  const { data, error } = await supabase
    .from('fights')
    .select('*')
    .eq('robot_id', robotId)
    .order('fight_id', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createFight(fight: Fight) {
  const fightData = {
    ...fight,
    last_updated: Date.now(),
  };
  
  const { data, error } = await supabase
    .from('fights')
    .insert(fightData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFight(fightId: number, fight: Partial<Fight>) {
  const fightData = {
    ...fight,
    last_updated: Date.now(),
  };
  
  const { data, error } = await supabase
    .from('fights')
    .update(fightData)
    .eq('fight_id', fightId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFight(fightId: number) {
  const { error } = await supabase
    .from('fights')
    .eq('fight_id', fightId)
    .delete();

  if (error) throw error;
}
