/**
 * TrueFinals scraper: fetches 12lb and 3lb exhibition pages via Puppeteer, parses with Cheerio,
 * and insert/updates fights for CRC robots with push notification broadcasts.
 */
import * as cheerio from "cheerio";
import 'dotenv/config';
import puppeteer, { type Page } from 'puppeteer';
import { CRC_ROBOTS } from '../../src/db/robots.ts';
import { updateFightNotifBroadcast } from '../../src/notifications/sendPushNotif.ts';
import { log } from '../../src/utils/log.ts';
import { getRobotId, supabaseAdmin } from './scraperHelper.js';

/** TrueFinals 12lb exhibition page URL. */
const BASE_URL_12LB = 'https://truefinals.com/tournament/nhrl_may26_12lb/exhibition';
/** TrueFinals 3lb exhibition page URL. */
const BASE_URL_3LB = 'https://truefinals.com/tournament/nhrl_may26_3lb/exhibition';

/**
 * Opens a headless browser, loads the exhibition URL, waits for game buttons, then runs `fn(page)`.
 * Browser is always closed after `fn` completes or throws.
 */
async function withTrueFinalsPage(url: string, fn: (page: Page) => Promise<void>): Promise<void> {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForSelector('button[id^="game-EX-"]', { timeout: 25_000 });
    await fn(page);
  } finally {
    await browser.close();
  }
}

/**
 * Convert a 12-hour time string to 24-hour "HH:MM" format.
 *
 * @param timeStr - Time string in "HH:MM AM/PM" or "H:MM AM/PM" form (e.g. "11:36 AM", "2:45 PM"). Leading/trailing whitespace is trimmed.
 * @returns 24-hour "HH:MM" string (e.g. "11:36", "14:45"), or the original string unchanged if the format does not match.
 *
 * Preconditions:
 * - None; safe to pass any string.
 * Invariants:
 * - 12 PM -> 12:xx, 12 AM -> 00:xx; other PM hours add 12, AM hours unchanged. Minutes are preserved. Single-digit hours accepted.
 */
function fightTimeTo24h(timeStr: string): string | null {
  const t = timeStr.trim();
  if (!t) return null;
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const isPm = match[3].toUpperCase() === 'PM';
  if (isPm && h !== 12) h += 12;
  if (!isPm && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}:00`;
}

//TODO: add QUALIFYING INFO (like Q1-02)
//workflow: scrape each fight, update DB once found
/*
HTML format:
<button type="button" id="game-EX-2fb9b326c7a34ed2-outer" class="...">
  <div class="relative isolate flex h-6..."> (CAGE TIME CONTAINER)
    <div ...>
    <div ....>{QUALIFYING INFO (like Q1-02)}</div>
    <div class="absolute bottom-[5px]...">
        <div class="skew-x-[27deg] scale-x-125">{CAGE NUMBER}</div>
    <div class="absolute bottom-[3px]...>{TIME INFORMATION (format: HH:MM AM/PM)}</div>
  <div class="relative box-border flex..."> (ROBOT INFO CONTAINER)
    <div ...>
    <div id="slot...">
        <div ...>
            <div ...>
                <div class="max-w-[168px]...">{ROBOT NAME 1}</div>
                ...info about results
        <div ...>{WIN STATUS (0 or 1)}</div>
    <div ...>
    <div id="slot...">
        <div ...>
            <div ...>
                <div class="max-w-[168px]...">{ROBOT NAME 1}</div>
                ...info about results
        <div ...>{WIN STATUS (0 or 1)}</div>
*/
/*
- parse through HTML for each corresponding component (button with id)
- loop through each button (the container for each fight)
- "row": raw DOM node for each button
- .each: cheerio method
*/
/**
 * Scrape the TrueFinals exhibition page already loaded into a Cheerio instance.
 * Finds competition title and all "game-EX-*" buttons; for each fight involving a CRC robot, fetches previous DB state, then insert/update/ignore and send notifications as needed.
 *
 * @param $ - Cheerio API instance loaded with the exhibition page HTML (from page.content + cheerio.load).
 * @param page - Live Puppeteer page (same session as $) for opening fight dialogs to read "Scheduled For".
 * @returns Promise that resolves when all visible exhibition fights have been processed. Rejects on unexpected errors (DB/notification errors may skip the row and continue).
 *
 * Preconditions:
 * - Page structure: competition from a fixed DOM path; fight rows are button[id^="game-EX-"] with cage/time container and slot-EX-* slots for robot names and win status.
 * - CRC_ROBOTS and supabaseAdmin are available; robots table has entries for our robot names.
 * Invariants:
 * - Fights not involving any CRC robot are skipped. If both win statuses are 0, is_win is null (incomplete). Updates only when fight_time, cage, or is_win change; no duplicate "Updated Fight" when nothing changed. Match identified by (robot_name, opponent_name, competition).
 */
//TODO: check if true finals updates more accurately than brettzone
type DialogFightContext = { our_robot_name: string; opponent_robot_name: string };

async function getDialogScheduledFor(
  page: Page,
  gameExSuffix: string,
  fight: DialogFightContext,
): Promise<string | null> {
  const clickSel = `#game-EX-${gameExSuffix}`;
  const dbg = { ...fight, gameExSuffix, clickSel };
  try {
    log('info', '[TrueFinals] dialog: click fight button', dbg);
    await page.click(clickSel);
    log('info', '[TrueFinals] dialog: wait for modal', fight);
    await page.waitForSelector('[role="dialog"], [data-state="open"]', { timeout: 5000 });
    log('info', '[TrueFinals] dialog: load HTML & find Scheduled For', fight);
    const $ = cheerio.load(await page.content());
    const target = $('div.whitespace-nowrap.text-\\[0\\.85em\\].font-medium.leading-none.text-nforeground1')
      .filter((_, el) => $(el).text().trim() === 'Scheduled For');
    const raw = target.next().text().trim();
    const normalized = raw ? fightTimeTo24h(raw) : null;
    log('info', '[TrueFinals] dialog: parsed time', { ...fight, raw, normalized });
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 150));
    log('info', '[TrueFinals] dialog: closed (Escape)', fight);
    return normalized;
  } catch (err) {
    log('warn', '[TrueFinals] dialog: failed', { ...fight, gameExSuffix, err: String(err) });
    try {
      await page.keyboard.press('Escape');
    } catch {
      /* ignore */
    }
    return null;
  }
}

async function scrapeTrueFinals($: cheerio.CheerioAPI, page: Page) {
    try{
        const competition = $('body')
          .children().first()
          .children().first()
          .children().first()
          .children().first()
          .children().eq(1)
          .children().first()
          .children().eq(1)
          .children().first()
          .children().first()
          .children().eq(1)
          .text();
        const rows = $('button[id^="game-EX-"]');
        for(let i=0; i<rows.length; i++){
            //wraps raw DOM node in Cheerio object to use Cheerio methods
            const $row = $(rows[i]);

            const $cage_time_container = $row.children().first(); //get first child of row, same as eq(0)
            //log('info', 'cage_time_container HTML', { html: $cage_time_container.html() });
            const cage_number = $cage_time_container.children().eq(2).children().first().text();
            const cage = cage_number ? parseInt(cage_number.replace(/^C/i, ''), 10) : null;
            //log('info', 'fight_time element HTML', { html: $cage_time_container.children().eq(3).html() }); 
            const $robot_info_container = $row.children().eq(1);
            const robot_names : string[] = []; //same as robot_names = new Array<string>();
            const win_statuses : string[] = []; 
            $robot_info_container.children('div[id^="slot-EX-"]').each((_, slot) => {
                const $slot = $(slot);
                const temp_name = $slot.children().first().children().first().children().first().text();
                robot_names.push(temp_name);
                const temp_win = $slot.children().eq(1).text();
                win_statuses.push(temp_win);
            });
            /*
            console.log("=============DEBUG LOG================");
            console.log("robot_names", robot_names);
            console.log("cage_number", cage_number, "cage (parsed)", cage);
            console.log("fight_time", fight_time);
            */

            //identify robot vs opponent
            //cast to readonly string[] because CRC_ROBOTS is `as const` (a readonly tuple of literals)
            //and .includes() on such a tuple narrows the argument type to the tuple's element types
            const our_robot_idx = robot_names.findIndex((name) => (CRC_ROBOTS as readonly string[]).includes(name));
            if(our_robot_idx === -1) {
                continue;
            }
            const opponent_idx = (our_robot_idx === 0) ? 1 : 0;
            const our_robot_name = robot_names[our_robot_idx];
            const opponent_robot_name = robot_names[opponent_idx];
            //if both win statuses are 0, then match is incomplete
            const our_win_status = win_statuses[our_robot_idx];
            const opponent_win_status = win_statuses[opponent_idx];

            //previous win status (from last webscraping cycle)
            const {data: prev, error: prev_error } = await supabaseAdmin.from('fights')
              .select('is_win, cage, fight_time')
              .eq('robot_name', our_robot_name)
              .eq('opponent_name', opponent_robot_name)
              .eq('competition', competition)
              .maybeSingle(); //returns null if no match found, not error

            if(prev_error) {
                console.error('Error fetching previous win status:', prev_error);
                continue;
            }
                       
            /*
            Goal: prevent duplicates
            Database:
            If match already ended (check database's win status), then IGNORE.
            Else, if any field (fight_time, cage, win status) changes, then UPDATE.
            Else, if no field changed, then IGNORE.

            Notifications:
            If THIS scraping cycle concludes a match: then "New Fight" notif.
            Else, if any field (fight_time, cage, win status) changes, then "Updated Fight" notif.
            Else, if no field changed, then NO notif.
            */

            let is_win: 'win' | 'lose' | null;
            if(our_win_status === '0' && opponent_win_status === '0') {
              is_win = null;
            }else{
              is_win = our_win_status === 'W' ? 'win' : 'lose';
            }
            const robot_id = await getRobotId(our_robot_name);
            if (robot_id === null) {
              log('info', `Robot "${our_robot_name}" not found in robots table, skipping fight`);
              continue;
            }

            //if either new match, or updapted match, then we also want to get dialog scheduled for
            //the current row[i] contains the game EX ID --> get this ID, then commence clicking
            const game_ex_id = $row.attr('id')?.replace('game-EX-', '');
            if(!game_ex_id){
              console.error('Error getting game EX ID for row:', $row.attr('id'));
              continue;
            }
            //this is the SCHEDULED time (different from time of call up)
            //but if has not been called up yet, then scheduled time == current time
            const fight_time = await getDialogScheduledFor(page, game_ex_id, {
              our_robot_name,
              opponent_robot_name,
            });
            const payload = {
              robot_id,
              cage: !Number.isNaN(cage) ? cage : null,
              fight_time: fight_time,
              is_win: is_win,
              robot_name: our_robot_name,
              opponent_name: opponent_robot_name,
              competition: competition
            };

            if(!prev){
              //TODO: ghost code lol, idk where notifs is getting called from
              //no previous match found, so this is a NEW match
              const { error } = await supabaseAdmin.from('fights').upsert(payload, { onConflict: 'robot_name, opponent_name, competition' });
              log('info', 'Inserted new fight for', { payload });
              if(error) {
                  console.error('Error updating supabase:', error);
                  continue;
              }
            }else{
              //is_win NULL -> non-null = fight just concluded -> Fight Result notif
              const isWinTransition = prev.is_win == null && is_win != null;
              //fight_time/cage updates -> Updated Fight notif (only if not already complete)
              const wasAlreadyComplete = prev.is_win != null;
              const scheduleChanged = prev.fight_time !== fight_time || prev.cage !== cage;

              if (!isWinTransition && !scheduleChanged) {
                continue;
              }

              const { error } = await supabaseAdmin.from('fights')
                .upsert(payload, {
                  onConflict: 'robot_name, opponent_name, competition'
                });
              if (error) {
                console.error('Error updating supabase:', error);
                continue;
              }

              if (isWinTransition) {
                //await updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: true });
              } else if (!wasAlreadyComplete && scheduleChanged) {
                //await updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: false });
              }
            }
        };
    }catch(error) {
        console.error('Error scraping True Finals:', error);
        throw error;
    }
}

/**
 * Run the full TrueFinals scrape for both 12lb and 3lb exhibition pages.
 * Fetches each page with Puppeteer, parses with Cheerio, and runs scrapeTrueFinals to update the DB and send notifications.
 *
 * @returns Promise that resolves when both 12lb and 3lb scrapes have completed. Rejects if Puppeteer or scrapeTrueFinals throws.
 *
 * Preconditions:
 * - BASE_URL_12LB and BASE_URL_3LB are reachable and render game-EX-* buttons.
 * - Environment and DB same as scrapeTrueFinals.
 * Invariants:
 * - 12lb is scraped first, then 3lb; each uses a fresh Puppeteer browser session.
 */
export async function runScrapeTrueFinals() {
  log('info', 'Fetching 12lb exhibition (Puppeteer)...');
  await withTrueFinalsPage(BASE_URL_12LB, async (page) => {
    await scrapeTrueFinals(cheerio.load(await page.content()), page);
  });

  log('info', 'Fetching 3lb exhibition (Puppeteer)...');
  await withTrueFinalsPage(BASE_URL_3LB, async (page) => {
    await scrapeTrueFinals(cheerio.load(await page.content()), page);
  });
}