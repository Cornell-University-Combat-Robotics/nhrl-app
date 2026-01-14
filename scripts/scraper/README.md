# BrettZone Scraper

Overview
- Scrapes https://brettzone.nhrl.io/brettZone/ to extract basic fight and robot data, then inserts/updates the project's Supabase database.

How it works
1. Fetch target page HTML (axios)
2. Parse entries (cheerio) — minimal extraction: robot name, opponent, cage, time, outcome, duration
3. Upsert robot and fights into Supabase
4. Log successes and errors to `./logs/scraper.log`

Configuration (env vars)
- SCRAPER_TARGET_URL: URL to scrape (defaults to the BrettZone URL above)
- SCRAPER_CRON: cron schedule string (default: `0 2 * * *` daily at 02:00)
- SCRAPER_LOG_DIR / SCRAPER_LOG_PATH: where to store logs
- SUPABASE_* env vars: existing project env keys are used by `src/supabaseClient.ts`. For a backend scraper running server-side consider using the Service Role key.

Run locally
- Install dependencies: `npm install`
- Run once: `npm run scrape -- --once`
- Start scheduler (runs in foreground): `npm run scrape`

Notes & next steps
- Selectors are heuristic; adjust `parseFights()` if the site structure differs.
- Consider running this script from a cron host, server, or as a GitHub Actions scheduled workflow for production.
- For higher reliability, add retries, backoff, and more robust deduplication/unique constraints in DB.
