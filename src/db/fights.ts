import { supabase } from '../supabaseClient';

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
  outcome_type: string;
}

export async function getAllFights() {
  const { data, error } = await supabase
    .from('fights')
    .select('*, robots!robot_id(robot_name, robot_id)')
    .order('fight_time', { ascending: false, nullsFirst: true })
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
  // Get current time in HH:MM:SS format
  const now = new Date().toTimeString().split(' ')[0];
  
  // Fetch robot name from robots table if not provided
  let robotName = fight.robot_name;
  if (!robotName) {
    const { data: robotData, error: robotError } = await supabase
      .from('robots')
      .select('robot_name')
      .eq('robot_id', fight.robot_id)
      .single();
    
    if (robotError) throw robotError;
    robotName = robotData?.robot_name || '';
  }
  
  const fightData = {
    ...fight,
    fight_time: fight.fight_time === '' ? null : fight.fight_time,
    robot_name: robotName,
    last_updated: now,
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
  // Get current time in HH:MM:SS format
  const now = new Date().toTimeString().split(' ')[0];
  
  const fightData = {
    ...fight,
    fight_time: fight.fight_time === '' ? null : fight.fight_time,
    last_updated: now,
  };

  // Remove undefined values
  const cleanData = Object.fromEntries(
    Object.entries(fightData).filter(([_, v]) => v !== undefined)
  );
  
  // Perform the update
  const { error } = await supabase
    .from('fights')
    .update(cleanData)
    .eq('fight_id', fightId);

  if (error) {
    console.error('Update error:', error);
    throw error;
  }
  
  // Fetch the updated record
  const { data, error: fetchError } = await supabase
    .from('fights')
    .select('*')
    .eq('fight_id', fightId)
    .single();

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    throw fetchError;
  }
  
  return data;
}

export async function deleteFight(fightId: number) {
  const { error } = await supabase
    .from('fights')
    .delete()
    .eq('fight_id', fightId);

  if (error) throw error;
}
