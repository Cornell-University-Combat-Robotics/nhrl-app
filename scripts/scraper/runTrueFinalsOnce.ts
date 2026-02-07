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
