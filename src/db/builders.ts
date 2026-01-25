import { supabase } from '../supabaseClient';

export interface Builder {
  builder_id?: number;
  builder_name: string;
  subteam_id: number;
}

export async function getAllBuilders() {
  const { data, error } = await supabase
    .from('builders')
    .select('*, subteams!subteam_id(subteam_name, subteam_id)')
    .order('builder_id', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBuilderById(builderId: number) {
  const { data, error } = await supabase
    .from('builders')
    .select('*, subteams!subteam_id(subteam_name, subteam_id)')
    .eq('builder_id', builderId)
    .single();

  if (error) throw error;
  return data;
}

export async function createBuilder(builder: Builder) {
  const { data, error } = await supabase
    .from('builders')
    .insert(builder)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBuilder(builderId: number, builder: Partial<Builder>) {
  const { data, error } = await supabase
    .from('builders')
    .update(builder)
    .eq('builder_id', builderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBuilder(builderId: number) {
  const { error } = await supabase
    .from('builders')
    .delete()
    .eq('builder_id', builderId);

  if (error) throw error;
}
