/** DB access for subteams table. */
import { supabase } from '../supabaseClient.ts';

export interface Subteam {
  subteam_id?: number;
  subteam_name: 'sportsman' | 'kinetic' | 'marketing' | 'autonomous';
}

/** All subteams, order by subteam_id asc. */
export async function getAllSubteams() {
  const { data, error } = await supabase
    .from('subteams')
    .select('*')
    .order('subteam_id', { ascending: true });

  if (error) throw error;
  return data;
}

/** Single subteam by id. */
export async function getSubteamById(subteamId: number) {
  const { data, error } = await supabase
    .from('subteams')
    .select('*')
    .eq('subteam_id', subteamId)
    .single();

  if (error) throw error;
  return data;
}

/** Insert subteam; returns created row. */
export async function createSubteam(subteam: Subteam) {
  const { data, error } = await supabase
    .from('subteams')
    .insert(subteam)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update subteam by id; returns updated row. */
export async function updateSubteam(subteamId: number, subteam: Partial<Subteam>) {
  const { data, error } = await supabase
    .from('subteams')
    .update(subteam)
    .eq('subteam_id', subteamId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete subteam by id. */
export async function deleteSubteam(subteamId: number) {
  const { error } = await supabase
    .from('subteams')
    .delete()
    .eq('subteam_id', subteamId);

  if (error) throw error;
}
