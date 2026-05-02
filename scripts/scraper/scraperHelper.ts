/**
 * Shared scraper infrastructure: Supabase admin client, robot lookup, dynamic cron scheduler,
 * and CRC robot list. Used by runScrapers and both scrapers. Cron is read from the DB at
 * startup; restart the process to pick up cron table changes.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import cron from 'node-cron';
import { getCron } from '../../src/db/cron.js';
import { log } from '../../src/utils/log.js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Shared Supabase admin client for scrapers and scheduler.
 * Uses service role key; has full DB access.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let activeTask: cron.ScheduledTask | null = null;

/**
 * Look up robot_id from the robots table by robot_name.
 *
 * @param robotName - Exact robot name as stored in `robots.robot_name`.
 * @returns The numeric `robot_id` if found, or `null` if not found or on DB error.
 *
 * Preconditions:
 * - `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be set.
 * Invariants:
 * - At most one row is returned (limit 1).
 * - Does not throw; errors are swallowed and result in `null`.
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

/**
 * A scraper is an async function that runs one scrape pass (e.g. BrettZone or TrueFinals).
 * Used by the scheduler to run all scrapers in sequence on each cron tick.
 */
export type ScraperFn = () => Promise<void>;

/**
 * Load cron schedule from the `cron` table and schedule a single cron job that runs all
 * scrapers in sequence on each tick. Stops any previously active task before rescheduling.
 *
 * @param scrapers - Array of scraper functions to run in order on each cron tick.
 * @returns Promise that resolves when scheduling is done (or rejects on missing cron data).
 *
 * Preconditions:
 * - `cron` table has at least one row with a valid `cron_schedule` (e.g. "0 * * * *").
 * - Each element of `scrapers` is a no-arg async function that may throw.
 * Invariants:
 * - Only one active cron task is ever running; calling this again stops the previous one.
 * - Scraper failures are logged but do not stop other scrapers from running.
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
 * Start the dynamic cron scheduler: load schedule from DB and register SIGINT handler
 * to stop the task before exit.
 *
 * @param scrapers - Array of scraper functions to run on each cron tick.
 * @returns Promise that resolves once the server is running (does not resolve on SIGINT).
 *
 * Preconditions:
 * - loadAndScheduleJobs(scrapers) can succeed (cron row exists).
 * Invariants:
 * - Process stays alive until SIGINT; then activeTask is stopped, exit(0).
 */
export async function start(scrapers: ScraperFn[]) {
  log('info', 'Starting dynamic cron server...');
  log('info', 'Time: ' + new Date().toISOString());

  await loadAndScheduleJobs(scrapers);

  log('info', 'Server is running. Restart the process to reload cron from the database.');

  process.on('SIGINT', async () => {
    log('info', 'Shutting down...');

    if (activeTask) {
      activeTask.stop();
    }

    log('info', 'Server shutdown complete');
    process.exit(0);
  });
}

/**
 * Either run all scrapers once and exit, or start the long-running scheduler.
 *
 * @param scrapers - Array of scraper functions to run (in order).
 * @param runOnce - If true, run each scraper once in sequence then process.exit(0). If false, start the scheduler from DB cron only.
 * @returns Promise that resolves when runOnce is true after scrapes complete, or when start() completes (scheduler running). Calls process.exit(0) when runOnce.
 *
 * Preconditions:
 * - For runOnce: scrapers run in order; one failure does not prevent the rest (caller may wrap in try/catch).
 * - For !runOnce: same as start(scrapers).
 * Invariants:
 * - When runOnce is true, process exits with 0 after all scrapers run; no scheduler is started.
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