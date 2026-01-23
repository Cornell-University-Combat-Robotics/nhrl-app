import { supabase } from '../supabaseClient.ts'
//TODO: change RLS policy to be more secure

export async function updateCron(cur_schedule: string){
    // Determine the new schedule value
    const newSchedule = cur_schedule === '* * * * *' 
        ? '0 2 * * *'  // If currently every minute, switch to daily at 2am
        : '* * * * *'; // Otherwise, switch to every minute
    
    const { data, error } = await supabase
        .from('cron')
        .update({ cron_schedule: newSchedule })  // ← Pass object directly
        .eq('job_name', 'scrapeBrettZone')

    console.log('updateCron', data, error);

    if (error) throw error;
    return data;
}

/**
 * @param client : optional param -- you can pass in supabaseAdmin if you want to use the server-side client
 */
export async function getCron(client = supabase){
    const { data, error } = await client
        .from('cron')
        .select('cron_schedule')
        .eq('job_name', 'scrapeBrettZone')


    console.log('getCron', data, error);

    if (error) throw error;
    return data; // data is Array<{cron_schedule: text}>
}