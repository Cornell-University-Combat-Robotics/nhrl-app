# NHRL App

A mobile app for tracking and displaying robot fight data from the National Havoc Robot League (NHRL), built with Expo and TypeScript.

## Overview

This app provides a comprehensive platform for managing and viewing NHRL robot fight information, with automated data collection and real-time updates.

### Core Features

1. **Database & Infrastructure**
   - Supabase database with table creation and migrations
   - Basic user authentication
   - Data persistence and synchronization

2. **Data Collection**
   - **Web Scraping Service**: Automated scraper that extracts fight data from BrettZone API
     - Scheduled scraping at fixed intervals
     - Parses essential fight data (robot names, opponents, outcomes, durations, etc.)
     - Inserts/updates database records automatically
     - Comprehensive error logging

3. **Data Display**
   - **Data Fetching**: Real-time data retrieval from Supabase
   - **UI Updates**: TanStack Query for efficient data synchronization and UI reactivity
   - Modern, responsive interface built with Tailwind CSS

4. **Manual Updates**
   - Admin interface for manual data edits
   - Changes sync across all user devices via Supabase
   - Real-time UI updates when data changes

5. **Notifications**
   - Local scheduled reminders using expo-notifications
   - Fight reminders and important updates

6. **User Interface**
   - Clean, functional design with component library
   - Tailwind CSS for styling
   - Cross-platform support (iOS, Android, Web)

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Install EAS CLI (for push notifications)

   ```bash
   npm install -g eas-cli
   ```

   Then login and link your project:
   ```bash
   eas login
   eas project:init
   ```

   This will link your local project to an Expo project and automatically configure the `projectId` needed for push notifications.

3. Set up environment variables

   Create a `.env` file with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_EXPO_PROJECT_ID=your_expo_project_id
   ```

4. Start the app

   ```bash
   npx expo start
   ```

5. Run the scraper (optional)

   See [Scrapers](#scrapers) below for all scrape commands.

## Scrapers

The app uses two scrapers: **BrettZone** (API) and **TrueFinals** (Puppeteer + Cheerio). They share one cron schedule and Supabase Realtime subscription.

**Puppeteer / Chrome:** The TrueFinals scraper uses Puppeteer. On first `npm install`, Puppeteer downloads a bundled Chromium. If you run in an environment where that fails (e.g. some CI or restricted systems), install a Chrome/Chromium binary and ensure it’s on `PATH`, or see [Puppeteer docs](https://pptr.dev/guides/configuration) for `executablePath` and related options.

**Scrape commands:**

| Command | Description |
|--------|-------------|
| `npm run scrape` | Start the scheduler: run both scrapers on the cron from the DB and listen for `cron` table changes. |
| `npm run scrape -- --once` | Run both scrapers once, then exit. |
| `npm run scrape-brettzone` | Run only the BrettZone scraper once, then exit. |
| `npm run scrape-truefinals` | Run only the TrueFinals scraper once (12lb + 3lb), then exit. |

For scheduled runs you need `SUPABASE_SERVICE_ROLE_KEY` in `.env` (and a `cron` row in the DB with `job_name: 'scrapeBrettZone'`).

## Project Structure

- `app/` - Expo Router file-based routing
- `src/` - Core application logic
  - `supabaseClient.ts` - Supabase configuration
  - `sql/` - Database schema and migrations
- `scripts/scraper/` - Web scraping service
  - `scheduler.ts` - Shared cron + Supabase Realtime
  - `runScrapers.ts` - Entry point for both scrapers
  - `scrapeBrettZone.ts` - BrettZone API scraper
  - `scrapeTrueFinals.ts` - TrueFinals (Puppeteer) scraper
  - `runBrettZoneOnce.ts` / `runTrueFinalsOnce.ts` - Single-scraper one-off runners

## Known Issues

- If you encounter this error `TypeError: configs.toReversed is not a function` after running `npx expo start`,
you need to update your node version to v20.

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Supabase documentation](https://supabase.com/docs)
- [TanStack Query documentation](https://tanstack.com/query/latest)
