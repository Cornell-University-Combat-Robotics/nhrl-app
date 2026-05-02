/** DB access for robots table (with builder join). */

export interface Robot {
  robot_id?: number;
  robot_name: string;
  builder_id: number;
  weight_class: '3lb' | '12lb';
  weapon: 'drum' | 'vertical spinner' | 'horizontal spinner';
  drive: 'walker' | '2 wheel' | '4 wheel';
  top_speed?: number;
  weapon_speed?: number;
  is_eliminated?: boolean;
}

/**
 * List of CRC robot names scraped by BrettZone and TrueFinals.
 * Each must exist in `robots.robot_name`.
 *
 * Source of truth for both the Expo app (admin notification form) and
 * the Node scrapers (`scripts/scraper/scrapeBrettZone.ts`, `scrapeTrueFinals.ts`).
 */
export const CRC_ROBOTS = [
  'Benny R. Johm',
  'Huey',
  'Apollo',
  'Jormungandr',
  'Four Horsemen',
] as const;
export type CRCRobotName = typeof CRC_ROBOTS[number];

//Lazy-loaded so Node-only callers (scrapers) can import `CRC_ROBOTS` without
//pulling React Native modules from `../supabaseClient.ts` at import time.
async function getSupabase() {
  const mod = await import('../supabaseClient');
  return mod.supabase;
}

/** All robots, joined with builders; order by robot_id desc. */
export async function getAllRobots() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('robots')
    .select('*, builders!builder_id(builder_name, builder_id)')
    .order('robot_id', { ascending: false });

  if (error) throw error;
  return data;
}

/** Single robot by id (with builder). Throws on error or not found. */
export async function getRobotById(robotId: number) {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('robots')
    .delete()
    .eq('robot_id', robotId);

  if (error) throw error;
}
