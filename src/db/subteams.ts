import { supabase } from '../supabaseClient';

export interface Subteam {
  subteam_id?: number;
  subteam_name: 'sportsman' | 'kinetic' | 'marketing' | 'autonomous';
}

export async function getAllSubteams() {
  const { data, error } = await supabase
    .from('subteams')
    .select('*')
    .order('subteam_id', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getSubteamById(subteamId: number) {
  const { data, error } = await supabase
    .from('subteams')
    .select('*')
    .eq('subteam_id', subteamId)
    .single();

  if (error) throw error;
  return data;
}

export async function createSubteam(subteam: Subteam) {
  const { data, error } = await supabase
    .from('subteams')
    .insert(subteam)
    .select()
    .single();

  if (error) throw error;
  return data;
}

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

export async function deleteSubteam(subteamId: number) {
  const { error } = await supabase
    .from('subteams')
    .eq('subteam_id', subteamId)
    .delete();

  if (error) throw error;
}
