/**
 * Main entry for the scraper process: runs BrettZone, TrueFinals exhibition, and TrueFinals bracket scrapers either once or on a dynamic cron schedule.
 *
 * Usage:
 * - `ts-node runScrapers.ts` (or node after build): start the scheduler (load cron from DB, subscribe to cron table, run scrapers on schedule).
 * - `ts-node runScrapers.ts --once` or `... run-now`: run all scrapers once in sequence (BrettZone → TrueFinals → bracket) then exit(0).
 *
 * Preconditions:
 * - Env: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; for BrettZone, SCRAPER_TARGET_URL optional.
 * - Cron table has a row with cron_schedule when not using --once.
 * Invariants:
 * - On success with --once: process exits 0. On scheduler mode: process runs until SIGINT. On unhandled rejection: log and exit(1).
 */
import { log } from '../../src/utils/log.ts';
import { runScrapeBracket } from './scrapeBracket.ts';
import { runScrape } from './scrapeBrettZone.ts';
import { runWithScheduler } from './scraperHelper.js';
import { runScrapeTrueFinals } from './scrapeTrueFinals.ts';

const args = process.argv.slice(2);
const runOnce = args.includes('--once') || args.includes('run-now');

runWithScheduler([runScrape, runScrapeTrueFinals, runScrapeBracket], runOnce).catch((error) => {
  log('error', 'Scrape failed', { error });
  process.exit(1);
});

