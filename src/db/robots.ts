import { supabase } from '../supabaseClient';

export interface Robot {
  robot_id?: number;
  robot_name: string;
  builder_id: number;
  weight_class: '3lb' | '12lb';
  weapon: 'drum' | 'vertical spinner' | 'horizontal spinner';
  drive: 'walker' | '2 wheel' | '4 wheel';
  top_speed?: number;
  weapon_speed?: number;
}

export async function getAllRobots() {
  const { data, error } = await supabase
    .from('robots')
    .select('*, builders!builder_id(builder_name, builder_id)')
    .order('robot_id', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRobotById(robotId: number) {
  const { data, error } = await supabase
    .from('robots')
    .select('*, builders!builder_id(builder_name, builder_id)')
    .eq('robot_id', robotId)
    .single();

  if (error) throw error;
  return data;
}

export async function createRobot(robot: Robot) {
  const { data, error } = await supabase
    .from('robots')
    .insert(robot)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRobot(robotId: number, robot: Partial<Robot>) {
  const { data, error } = await supabase
    .from('robots')
    .update(robot)
    .eq('robot_id', robotId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRobot(robotId: number) {
  const { error } = await supabase
    .from('robots')
    .eq('robot_id', robotId)
    .delete();

  if (error) throw error;
}
