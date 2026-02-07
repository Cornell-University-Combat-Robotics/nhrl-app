import 'dotenv/config';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { getCron } from '../../src/db/cron.ts';
import { log } from '../../src/utils/log.ts';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Shared Supabase admin client for scrapers and scheduler (realtime, cron). */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

let activeTask: cron.ScheduledTask | null = null;

/**
 * Look up robot_id from robots table by robot_name. Returns null if not found or on error.
 * Shared by BrettZone and TrueFinals scrapers.
 */
export async function getRobotId(robotName: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('robots')
    .select('robot_id')
    .eq('robot_name', robotName)
    .limit(1);
  if (error) return null;
  if (data && data.length > 0) return (data[0] as { robot_id: number }).robot_id;
  return null;
}

export type ScraperFn = () => Promise<void>;

/**
 * Load cron schedule from DB and schedule a single job that runs all scrapers in sequence.
 */
export async function loadAndScheduleJobs(scrapers: ScraperFn[]) {
  log('info', 'Loading and scheduling jobs...');

  try {
    const cron_data = await getCron(supabaseAdmin);
    if (cron_data && cron_data.length > 0) {
      const cron_schedule = cron_data[0].cron_schedule;

      if (activeTask) {
        activeTask.stop();
      }

      activeTask = cron.schedule(cron_schedule, async () => {
        log('info', 'Running scheduled scrape(s)...');
        for (const run of scrapers) {
          try {
            await run();
          } catch (err: unknown) {
            log('error', 'Scheduled scraper failed', { err: String(err) });
          }
        }
      });

      log('info', `[SCHEDULER STARTED] ${cron_schedule}`);
    } else {
      throw new Error('No cron data found');
    }
  } catch (error) {
    log('error', 'Error loading and scheduling jobs', { error });
  }
}

/**
 * Subscribe to cron table changes and reload schedule when it changes.
 */
export function setupRealtimeSubscription(scrapers: ScraperFn[]) {
  log('info', 'Setting up realtime subscription');

  const channel = supabaseAdmin
    .channel('cron-config-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cron',
      },
      (payload) => {
        log('info', 'Cron config changed', { payload });
        loadAndScheduleJobs(scrapers);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        log('info', 'Successfully subscribed to cron-config-changes channel');
      } else {
        log('error', 'Failed to subscribe to cron-config-changes channel', { status });
      }
    });

  return channel;
}

/**
 * Start the scheduler: load cron, subscribe to realtime, handle SIGINT.
 */
export async function start(scrapers: ScraperFn[]) {
  log('info', 'Starting realtime dynamic cron server...');
  log('info', 'Time: ' + new Date().toISOString());

  await loadAndScheduleJobs(scrapers);

  const channel = setupRealtimeSubscription(scrapers);

  log('info', 'Server is running. Listening for database changes in real-time.');

  process.on('SIGINT', async () => {
    log('info', 'Shutting down...');

    if (activeTask) {
      activeTask.stop();
    }

    channel.unsubscribe();
    log('info', 'Server shutdown complete');
    process.exit(0);
  });
}

/**
 * Run once: execute all scrapers in sequence then exit.
 * Otherwise start the scheduler (cron + realtime).
 */
export async function runWithScheduler(
  scrapers: ScraperFn[],
  runOnce: boolean
) {
  if (runOnce) {
    for (const run of scrapers) {
      await run();
    }
    log('info', 'Scrape(s) completed successfully');
    process.exit(0);
  } else {
    await start(scrapers);
  }
}
