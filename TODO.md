# TODO Comments – Compiled Reference

This document compiles all TODO and TOOD comments found across the codebase for easy tracking and prioritization.

---

## Scrapers

### `scripts/scraper/scrapeTrueFinals.ts`

| Line | Tag   | Description |
|------|-------|-------------|
| 8    | TODO  | **Scrape for Huey too; pass tournament ID for future competitions** — Currently the scraper uses hardcoded URLs for 12lb and 3lb weight classes (`nhrl_feb26_12lb`, `nhrl_feb26_3lb`). Should be generalized to accept a tournament ID parameter so it can scrape Huey and other future competitions without code changes. |
| 11   | TODO  | **Change every competition** — `COMPETITION` is hardcoded to `'feb 26'` and must be manually updated for each new competition. |
| 40   | TODO  | **Repeated from scrapeBrettZone.ts – clean up** — `CRC_ROBOTS` array is duplicated in both `scrapeTrueFinals.ts` and `scrapeBrettZone.ts`. Should be extracted to a shared module (e.g. `scheduler.ts` or a constants file) to avoid drift. |
| 50   | TODO  | **Add QUALIFYING INFO (like Q1-02)** — The HTML parsing extracts cage number and time, but not the qualifying round info (e.g. Q1-02) which appears in the cage time container. Should extend the scraper to capture and persist this field. |
| 83   | TODO  | **Check if True Finals updates more accurately than BrettZone** — Need to validate whether True Finals is a more reliable/accurate source than BrettZone for fight data. Could inform which scraper to prioritize or whether to run both and reconcile. |

### `scripts/scraper/scrapeBrettZone.ts`

| Line | Tag   | Description |
|------|-------|-------------|
| 11   | TODO  | **On Expo side, also make sure that any edits are server side** — Ensure that fight edits made in the Expo app are persisted server-side and not only locally, so data stays consistent across devices and with the scrapers. |
| 35   | TODO  | **Normalize to "may 25"** — The API returns `tournamentID` in formats like `"nhrl_may25_12lb"`. Should normalize to a human-friendly format such as `"may 25"` for consistency with other parts of the app. |
| 67   | TODO  | **Check against Fight interface in fights.ts** — The `parseFightsFromApi` mapped object should be validated against the `Fight` interface. Note: `Fight.is_win` is documented as `'1' \| '0' \| null` in `fights.ts` but `parseFightsFromApi` returns `'win' \| 'lose'`. Verify alignment. |

---

## Notifications

### `src/notifications/sendPushNotif.ts`

| Line | Tag   | Description |
|------|-------|-------------|
| 61   | TODO  | **Need for delete fight?** — The `editFightNotifBroadcast` function broadcasts when fights are created or updated. Unclear if push notifications should also be sent when a fight is deleted. Decide and implement if needed. |

---

## Admin / Forms

### `app/(admin)/fight-form.tsx`

| Line | Tag   | Description |
|------|-------|-------------|
| 69   | TOOD  | **Manually added fights may not sync up with scraper (create duplicate fights)** — Concern that fights created via the admin form could be duplicated when the scraper runs and finds the same fight. Need a deduplication strategy: e.g. matching on `robot_id`, `opponent_name`, `competition`, `cage`, and `fight_time` before insert, or a canonical external ID from the source system. |

---

## Database & Cron

### `src/db/cron.ts`

| Line | Tag   | Description |
|------|-------|-------------|
| 2    | TODO  | **Change RLS policy to be more secure** — The cron table operations (e.g. `updateCron`, `getCron`) may be using overly permissive Row Level Security. Review and tighten RLS policies for the `cron` table. |

---

## Schema / Migrations

### `supabase/migrations/20251019154943_init_schema.sql`

### `src/sql/master.sql`

### `src/sql/002_create-builders.sql`

| Line | Tag   | Description |
|------|-------|-------------|
| 14–15 | TODO  | **Need another one for driver?** — Placed near the `drive` enum (`'walker', '2 wheel', '4 wheel'`). Suggests possibly adding another drive type (e.g. for “driver” in a different sense) or clarifying if the `drive` enum is complete. Context is slightly ambiguous—could also mean a separate builder/driver role. |

---

## Summary

| Category       | Count |
|----------------|-------|
| Scrapers       | 7     |
| Notifications  | 1     |
| Admin / Forms  | 1     |
| Database/Cron  | 1     |
| Schema         | 3*    |

\*Same TODO appears in 3 schema files.

**Note:** One comment uses the typo `TOOD` instead of `TODO` (in `fight-form.tsx`). Consider fixing the typo in the source and replacing with `TODO` for consistency.
