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
