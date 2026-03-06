/**
 * One-off TrueFinals scraper entry. Runs runScrapeTrueFinals() once (12lb + 3lb) then exits.
 *
 * Usage: `ts-node runTrueFinalsOnce.ts` (or node after build).
 *
 * Preconditions: Same as runScrapeTrueFinals (TrueFinals URLs reachable, Puppeteer available, Supabase env set, CRC robots in DB).
 * Invariants: On success exits 0; on rejection logs and exits 1.
 */
import { log } from '../../src/utils/log.ts';
import { runScrapeTrueFinals } from './scrapeTrueFinals.ts';

runScrapeTrueFinals()
  .then(() => {
    log('info', 'TrueFinals scrape completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    log('error', 'TrueFinals scrape failed', { error });
    process.exit(1);
  });
