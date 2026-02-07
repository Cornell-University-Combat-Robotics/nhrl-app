import { log } from '../../src/utils/log.ts';
import { runWithScheduler } from './scheduler.ts';
import { runScrape } from './scrapeBrettZone.ts';
import { runScrapeTrueFinals } from './scrapeTrueFinals.ts';

const args = process.argv.slice(2);
const runOnce = args.includes('--once') || args.includes('run-now');

runWithScheduler([runScrape, runScrapeTrueFinals], runOnce).catch((error) => {
  log('error', 'Scrape failed', { error });
  process.exit(1);
});
