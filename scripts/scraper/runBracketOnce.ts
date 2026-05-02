/**
 * One-off bracket scraper entry. Runs runScrapeBracket() once (12lb + 3lb) then exits.
 *
 * Usage: `ts-node runBracketOnce.ts` (or node after build).
 */
import { log } from '../../src/utils/log.ts';
import { runScrapeBracket } from './scrapeBracket.ts';

runScrapeBracket()
  .then(() => {
    log('info', 'Bracket scrape completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    log('error', 'Bracket scrape failed', { error });
    process.exit(1);
  });
