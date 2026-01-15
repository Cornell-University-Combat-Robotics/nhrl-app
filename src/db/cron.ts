import { supabase } from '../supabaseClient';

export async function updateCron(cur_schedule: string){
    // Determine the new schedule value
    const newSchedule = cur_schedule === '* * * * *' 
        ? '0 2 * * *'  // If currently every minute, switch to daily at 2am
        : '* * * * *'; // Otherwise, switch to every minute
    
    const { data, error } = await supabase  
        .from('cron')
        .update({ cron_schedule: newSchedule })  // ← Pass object directly
        .eq('id', 1)

    if (error) throw error;
    return data;
}

export async function getCron(){
    const { data, error } = await supabase
        .from('cron')
        .select('cron_schedule')
        .eq('id', 1)

    if (error) throw error;
    return data; // data is Array<{cron_schedule: text}>
}