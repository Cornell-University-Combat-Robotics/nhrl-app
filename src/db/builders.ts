/** DB access for builders table (with subteam join). */
import { supabase } from '../supabaseClient.ts';

export interface Builder {
  builder_id?: number;
  builder_name: string;
  subteam_id: number;
}

/** All builders with subteam; order by builder_id desc. */
export async function getAllBuilders() {
  const { data, error } = await supabase
    .from('builders')
    .select('*, subteams!subteam_id(subteam_name, subteam_id)')
    .order('builder_id', { ascending: false });

  if (error) throw error;
  return data;
}

/** Single builder by id (with subteam). */
export async function getBuilderById(builderId: number) {
  const { data, error } = await supabase
    .from('builders')
    .select('*, subteams!subteam_id(subteam_name, subteam_id)')
    .eq('builder_id', builderId)
    .single();

  if (error) throw error;
  return data;
}

/** Insert builder; returns created row. */
export async function createBuilder(builder: Builder) {
  const { data, error } = await supabase
    .from('builders')
    .insert(builder)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update builder by id; returns updated row. */
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

/** Delete builder by id. */
export async function deleteBuilder(builderId: number) {
  const { error } = await supabase
    .from('builders')
    .delete()
    .eq('builder_id', builderId);

  if (error) throw error;
}
