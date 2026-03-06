/**
 * One-off BrettZone scraper entry. Runs runScrape() once then exits.
 *
 * Usage: `ts-node runBrettZoneOnce.ts` (or node after build).
 *
 * Preconditions: Same as runScrape (BrettZone API reachable, Supabase env set, CRC robots in DB).
 * Invariants: On success exits 0; on rejection logs and exits 1.
 */
import { log } from '../../src/utils/log.ts';
import { runScrape } from './scrapeBrettZone.ts';

runScrape()
  .then(() => {
    log('info', 'BrettZone scrape completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    log('error', 'BrettZone scrape failed', { error });
    process.exit(1);
  });
