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

2. Set up environment variables

   Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the app

   ```bash
   npx expo start
   ```

4. Run the scraper (optional)

   ```bash
   npm run scrape -- --once
   ```

## Project Structure

- `app/` - Expo Router file-based routing
- `src/` - Core application logic
  - `supabaseClient.ts` - Supabase configuration
  - `sql/` - Database schema and migrations
- `scripts/scraper/` - Web scraping service
  - `scrapeBrettZone.ts` - Main scraper implementation

## Known Issues

- If you encounter this error `TypeError: configs.toReversed is not a function` after running `npx expo start`,
you need to update your node version to v20.

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Supabase documentation](https://supabase.com/docs)
- [TanStack Query documentation](https://tanstack.com/query/latest)
