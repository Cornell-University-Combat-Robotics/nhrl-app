/** DB access for robots table (with builder join). */
import { supabase } from '../supabaseClient.ts';

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

export const CRC_ROBOTS = [
  'Benny R. Johm',
  'Huey',
  'Apollo',
  'Jormangandr',
  'Four Horsemen',
] as const;
export type CRCRobotName = typeof CRC_ROBOTS[number];

/** All robots, joined with builders; order by robot_id desc. */
export async function getAllRobots() {
  const { data, error } = await supabase
    .from('robots')
    .select('*, builders!builder_id(builder_name, builder_id)')
    .order('robot_id', { ascending: false });

  if (error) throw error;
  return data;
}

/** Single robot by id (with builder). Throws on error or not found. */
export async function getRobotById(robotId: number) {
  const { data, error } = await supabase
    .from('robots')
    .select('*, builders!builder_id(builder_name, builder_id)')
    .eq('robot_id', robotId)
    .single();

  if (error) throw error;
  return data;
}

/** Insert robot; returns created row. */
export async function createRobot(robot: Robot) {
  const { data, error } = await supabase
    .from('robots')
    .insert(robot)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update robot by id; returns updated row. */
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

/** Delete robot by id. */
export async function deleteRobot(robotId: number) {
  const { error } = await supabase
    .from('robots')
    .delete()
    .eq('robot_id', robotId);

  if (error) throw error;
}
