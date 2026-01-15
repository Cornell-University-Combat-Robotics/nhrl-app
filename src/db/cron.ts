import { supabase } from '../supabaseClient';

export async function updateCron(cur: boolean){
    const { data, error } = await supabase  
        .from('cron')
        .update({isSeason: !cur})
        .eq('id', 1) //always the same!! only every one entry in cron table

    if (error) throw error;
    return data;
}

export async function getCron(){
    const { data, error } = await supabase
        .from('cron')
        .select('isSeason')
        .eq('id', 1)

    if (error) throw error;
    return data;
}