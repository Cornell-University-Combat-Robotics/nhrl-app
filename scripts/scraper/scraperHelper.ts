/**
 * Shared scraper infrastructure: Supabase admin client, robot lookup, dynamic cron scheduler,
 * TrueFinals/bracket Puppeteer helpers, and CRC robot list. Used by runScrapers and scrapers.
 * Cron is read from the DB at startup; restart the process to pick up cron table changes.
 */
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import cron from 'node-cron';
import puppeteer, { type Page } from 'puppeteer';
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

/** Context for dialog debug logs (CRC robot vs opponent). */
export type DialogFightContext = {
  our_robot_name: string;
  opponent_robot_name: string;
};

/** 12-hour "h:mm AM/PM" → 24-hour `HH:MM:00` for DB TIME; empty or non-match → null. */
export function fightTimeTo24h(timeStr: string): string | null {
  const t = timeStr.trim();
  if (!t) return null;
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const isPm = match[3].toUpperCase() === 'PM';
  if (isPm && h !== 12) h += 12;
  if (!isPm && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}:00`;
}

/**
 * Launch headless Chrome, open `url`, wait for `waitSelector`, then run `fn(page)`.
 * Browser is always closed after `fn` completes or throws.
 */
export async function withTournamentPage(
  url: string,
  waitSelector: string,
  fn: (page: Page) => Promise<void>,
  gotoTimeoutMs = 30_000,
  selectorTimeoutMs = 25_000,
): Promise<void> {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: gotoTimeoutMs });
    await page.waitForSelector(waitSelector, { timeout: selectorTimeoutMs });
    await fn(page);
  } finally {
    await browser.close();
  }
}

function buttonIdSelector(buttonId: string): string {
  return `button[id="${buttonId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;
}

/**
 * Click the fight row button, read "Scheduled For" from the modal, normalize time, close with Escape.
 */
export async function getDialogScheduledFor(
  page: Page,
  buttonId: string,
  fight: DialogFightContext,
  logTag: string,
): Promise<string | null> {
  if (!buttonId) {
    log('warn', `[${logTag}] dialog: empty button id`, fight);
    return null;
  }
  const clickSel = buttonIdSelector(buttonId);
  const dbg = { ...fight, buttonId, clickSel };
  try {
    log('info', `[${logTag}] dialog: click fight button`, dbg);
    await page.click(clickSel);
    log('info', `[${logTag}] dialog: wait for modal`, fight);
    await page.waitForSelector('[role="dialog"], [data-state="open"]', { timeout: 5000 });
    log('info', `[${logTag}] dialog: load HTML & find Scheduled For`, fight);
    const $ = cheerio.load(await page.content());
    const target = $('div.whitespace-nowrap.text-\\[0\\.85em\\].font-medium.leading-none.text-nforeground1')
      .filter((_, el) => $(el).text().trim() === 'Scheduled For');
    const raw = target.next().text().trim();
    const normalized = raw ? fightTimeTo24h(raw) : null;
    log('info', `[${logTag}] dialog: parsed time`, { ...fight, raw, normalized });
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 150));
    log('info', `[${logTag}] dialog: closed (Escape)`, fight);
    return normalized;
  } catch (err) {
    log('warn', `[${logTag}] dialog: failed`, { ...fight, buttonId, err: String(err) });
    try {
      await page.keyboard.press('Escape');
    } catch {
      /* ignore */
    }
    return null;
  }
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