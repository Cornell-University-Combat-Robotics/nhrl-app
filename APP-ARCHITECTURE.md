# NHRL App — Architecture & Functionality

A human-readable summary of how the app is built and how its main features work.

---

## 1. Architecture

### 1.1 Expo

The app is a **React Native** application built with **Expo**. It runs on iOS, Android, and Web.

- **Expo Router** (file-based routing): Screens live under `app/`. Route groups define structure:
  - **`(auth)`** — Login and signup (unauthenticated).
  - **`(tabs)`** — Main app: Home, About, Fights (tabs).
  - **`(admin)`** — Admin-only: dashboard, CRUD for fights, robots, builders, subteams.
- **Entry**: `expo-router/entry` in `package.json`; root layout in `app/_layout.tsx` wraps the app with auth, TanStack Query, and notification listeners.
- **Styling**: NativeWind (Tailwind for React Native) for a consistent, responsive UI.
- **State & data**: TanStack Query for server state (fights, robots, builders, subteams, cron). Auth and push registration live in React context and Supabase client.

Expo also provides **expo-notifications** for push (see Notifications below) and **expo-constants** for config (e.g. `EXPO_PUBLIC_EXPO_PROJECT_ID` for push tokens).

### 1.2 Database (Supabase)

**Supabase** is the backend: Postgres database, Auth, and Realtime. The app uses **one Supabase project**; different clients use different keys.

- **Client (app)**: Uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. This client is used for:
  - Auth (login/signup, session).
  - All app reads/writes: fights, robots, builders, subteams, profiles, cron.
  - Realtime subscriptions (e.g. `fights` table changes for live UI; optional `cron` subscription on the server).
- **Server (scrapers/scheduler)**: Uses the same URL plus `SUPABASE_SERVICE_ROLE_KEY` (never shipped to the app). Used for:
  - Scraper writes (upsert fights).
  - Reading cron config and subscribing to `cron` table changes.
  - Sending push notifications (reads `profiles.expo_push_token`).

**Main tables and roles:**

| Table / concept | Purpose |
|-----------------|--------|
| **fights** | One row per fight: our robot vs opponent, cage, time, result (win/loss/null), duration, outcome type, competition. Linked to `robots` via `robot_id`. Unique on `(robot_name, opponent_name, competition)`. |
| **robots** | CRC robots: name, weight class, weapon, drive, speeds. Referenced by fights and by builders (many-to-many via `robots_builders`). |
| **builders** | Team members; each belongs to a **subteam**. |
| **subteams** | Team structure (e.g. sportsman, kinetic, marketing, autonomous). |
| **robots_builders** | Join table: which builders are associated with which robots. |
| **profiles** | One per auth user: `id` (matches `auth.users`), `role` (e.g. `admin` for admin UI), `expo_push_token` (for push notifications). |
| **cron** | Scheduler config: at least one row with `job_name: 'scrapeBrettZone'` and `cron_schedule` (e.g. `0 2 * * *` for daily at 2am). Scraper process reads this and subscribes to changes to reload the schedule without restarting. |

The database is the single source of truth. The app and the scrapers both read/write Supabase; manual edits and scraped data stay in sync through the same tables and Realtime.

---

## 2. Functionality

### 2.1 Manual updates (admin)

**What it is:** Admins can create, edit, and delete fights (and manage robots, builders, subteams) from inside the app.

**How it works:**

1. **Access**: Only users with `profiles.role = 'admin'` see the Admin entry and can open `(admin)` routes. Auth is Supabase Auth; admin status is read from `profiles` in `AuthContext` and exposed as `isAdmin`.
2. **CRUD**: Admin screens use TanStack Query hooks that call Supabase from the client:
   - **Fights**: `useFights`, `useCreateFight`, `useUpdateFight`, `useDeleteFight` (backed by `src/db/fights.ts`: `getAllFights`, `createFight`, `updateFight`, `deleteFight`).
   - Create/update fight flows (e.g. `fight-form`) send the same payload shape the scrapers use (robot, opponent, cage, time, competition, win/loss, outcome type, duration). For updates, the form calls `updateFight` then, when appropriate, triggers the same notification helpers as the scrapers (`createFightNotifBroadcast` for new fights, `updateFightNotifBroadcast` for updates, including “fight result” vs “updated fight”).
3. **Sync and UI**: All fight list screens (tabs and admin) use `useRealtimeFights()`: a Supabase Realtime subscription on the `fights` table. On any INSERT/UPDATE/DELETE, the hook invalidates the TanStack Query cache for `['fights']`, so lists refetch and stay in sync across devices and with scraper updates. Manual edits are just normal Supabase writes; they flow through the same Realtime channel.

So: manual update is “edit in admin UI → Supabase → Realtime → all clients refetch and see the same data.”

### 2.2 Web scraping

**What it is:** Two independent scrapers fill the **fights** table from external sources. They run in a **single process** that can either run once or run on a schedule and react to cron config changes.

**BrettZone (API):**

- **Source**: HTTP API (e.g. `brettzone.nhrl.io/.../fightsByBot.php?bot=<robot_name>`).
- **Flow**: For each of a fixed list of CRC robot names, the scraper fetches JSON, parses matches (player1/player2, cage, time, wins, outcome, duration, competition), normalizes into a single “our robot vs opponent” shape, then **upserts** into `fights` on `(robot_name, opponent_name, competition)`.
- **Writes**: One upsert per fight; uses Supabase admin client. On insert it sends a “New Fight” broadcast; on update it sends “Updated Fight” or “Fight Result” depending on whether the outcome (win/loss) was just set.

**TrueFinals (browser + HTML):**

- **Source**: Two fixed TrueFinals exhibition URLs (12 lb and 3 lb). Content is JS-rendered, so the scraper cannot rely on plain HTTP.
- **Flow**: For each URL, **Puppeteer** launches a headless browser, loads the page, waits for fight buttons to appear, then returns the full HTML. **Cheerio** parses that HTML: finds each fight block, reads cage, time, robot names, and win status. Only fights involving a CRC robot are processed; for each, it resolves `robot_id` from the `robots` table, then either inserts a new row or updates an existing one (same uniqueness as BrettZone) if cage, time, or result changed.
- **Writes**: Same `fights` table and same notification rules as BrettZone (new fight → “New Fight”; updated with result → “Fight Result”; other updates → “Updated Fight”).

**Scheduler (shared):**

- **Entry**: `npm run scrape` runs `runScrapers.ts`, which runs both scrapers (BrettZone then TrueFinals) either once (`--once`) or under a scheduler.
- **Cron**: The scheduler reads the `cron` table (row with `job_name: 'scrapeBrettZone'`) to get a cron expression (e.g. `0 2 * * *`). It uses **node-cron** to run both scrapers in sequence at that schedule.
- **Realtime**: The same process subscribes to Supabase Realtime on the `cron` table. When the cron row changes (e.g. an admin changes the schedule in the DB), the process reloads and reschedules the job without restarting. So: one long-running “scraper + scheduler” process, config driven by the database.

**Summary:** Manual updates and both scrapers write into the same `fights` table; uniqueness and notifications are aligned so that whether a fight is created/updated by an admin or by BrettZone or TrueFinals, the app and notifications behave consistently.

### 2.3 Notifications

**What it is:** Push notifications for fight events (new fight, updated fight, fight result). Delivered via **Expo Push Notifications**; recipients are all app users whose profiles have an `expo_push_token`.

**Registration (per device):**

- On sign-in (or when the session is restored), `AuthContext` calls `registerForPushNotificationsAsync()` (expo-notifications). That checks/requests permission and then requests an **Expo push token** from Expo’s servers (`exp.host`), tied to the app’s `EXPO_PUBLIC_EXPO_PROJECT_ID`.
- The token is stored in `profiles.expo_push_token` for the current user (`id = auth.users.id`), via Supabase update from the app. So each device gets one token; the latest token wins for that user.

**Sending (broadcast):**

- **Who sends:** Both scrapers (BrettZone and TrueFinals) and the **manual update path** (admin fight-form) call the same helpers in `sendPushNotif.ts`: `createFightNotifBroadcast` (new fight), `updateFightNotifBroadcast` (updated fight or fight result). Those helpers run in the context that just wrote the fight: scrapers use the Supabase admin client; the app uses the anon client.
- **How:** The helper queries `profiles` for all rows with non-null `expo_push_token`, then for each token sends one HTTP POST to Expo’s push API (`https://exp.host/--/api/v2/push/send`) with title and body. So every registered device gets the same message (broadcast).
- **When:** On insert: “New Fight” (robot vs opponent, time, cage). On update: if the update sets the outcome (win/loss) for the first time → “Fight Result” (win/loss + optional outcome type); otherwise → “Updated Fight” (time/cage/details).

**In-app behavior:** expo-notifications is configured in the root layout: foreground notifications can show alert/sound/badge; listeners for “notification received” and “user tapped notification” are registered there (e.g. for future deep links). No local scheduled reminders are implemented in the codebase; “notifications” here means these push broadcasts driven by fight data changes.

---

## 3. End-to-end flow summary

- **Data in**: Scrapers (BrettZone API + TrueFinals browser) and admins (forms) write into Supabase `fights` (and related tables). Scraper schedule is in `cron`; one process runs the cron and listens for `cron` changes.
- **Data out**: The app reads fights (and other entities) via TanStack Query and Supabase client; Realtime on `fights` invalidates the cache so all clients see updates. Push notifications are sent by the same code paths that write fights (scrapers or app), by querying `profiles.expo_push_token` and calling Expo’s push API.

This keeps architecture and functionality consistent: one database, one Realtime channel for fights, one set of notification rules whether the change came from automation or from an admin.
