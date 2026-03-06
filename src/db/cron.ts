/** DB access for cron table (scraper schedule). */
import { supabase } from '../supabaseClient.ts'

/** Toggle schedule: '* * * * *' → '0 2 * * *', else → '* * * * *'. Updates row where job_name = 'scrape'. */
export async function updateCron(cur_schedule: string){
    // Determine the new schedule value
    const newSchedule = cur_schedule === '* * * * *' 
        ? '0 2 * * *'  // If currently every minute, switch to daily at 2am
        : '* * * * *'; // Otherwise, switch to every minute
    
    const { data, error } = await supabase
        .from('cron')
        .update({ cron_schedule: newSchedule })  // ← Pass object directly
        .eq('job_name', 'scrape')

    console.log('updateCron', data, error);

    if (error) throw error;
    return data;
}

/** Cron schedule for job_name = 'scrape'. Pass supabaseAdmin for server-side. Returns Array<{cron_schedule}>. */
export async function getCron(client = supabase){
    const { data, error } = await client
        .from('cron')
        .select('cron_schedule')
        .eq('job_name', 'scrape')


    console.log('getCron', data, error);

    if (error) throw error;
    return data; // data is Array<{cron_schedule: text}>
}