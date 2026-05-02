/**
 * TrueFinals scraper: fetches 12lb and 3lb exhibition pages via Puppeteer, parses with Cheerio,
 * and insert/updates fights for CRC robots with push notification broadcasts.
 */
import * as cheerio from "cheerio";
import 'dotenv/config';
import type { Page } from 'puppeteer';
import { CRC_ROBOTS } from '../../src/db/robots.ts';
import { log } from '../../src/utils/log.ts';
import {
  getDialogScheduledFor,
  getRobotId,
  supabaseAdmin,
  withTournamentPage,
} from './scraperHelper.js';

/** TrueFinals 12lb exhibition page URL. */
const BASE_URL_12LB = 'https://truefinals.com/tournament/nhrl_may26_12lb/exhibition';
/** TrueFinals 3lb exhibition page URL. */
const BASE_URL_3LB = 'https://truefinals.com/tournament/nhrl_may26_3lb/exhibition';

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
 * - Page structure: competition from a fixed DOM path; fight rows are button[id^="game-EX-"] with cage/time container and slot-* slots for robot names and win status.
 * - CRC_ROBOTS and supabaseAdmin are available; robots table has entries for our robot names.
 * Invariants:
 * - Fights not involving any CRC robot are skipped. If both win statuses are 0, is_win is null (incomplete). Updates only when fight_time, cage, or is_win change; no duplicate "Updated Fight" when nothing changed. Match identified by (robot_name, opponent_name, competition).
 */
//TODO: check if true finals updates more accurately than brettzone
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
            const cage_number = $cage_time_container.children().eq(2).children().first().text();
            const cage = cage_number ? parseInt(cage_number.replace(/^C/i, ''), 10) : null;
            const $robot_info_container = $row.children().eq(1);
            const robot_names : string[] = [];
            const win_statuses : string[] = [];
            $robot_info_container.children('div[id^="slot-"]').each((_, slot) => {
                const $slot = $(slot);
                const temp_name = $slot.children().first().children().first().children().first().text();
                robot_names.push(temp_name);
                const temp_win = $slot.children().eq(1).text();
                win_statuses.push(temp_win);
            });

            const our_robot_idx = robot_names.findIndex((name) => (CRC_ROBOTS as readonly string[]).includes(name));
            if(our_robot_idx === -1) {
                continue;
            }
            const opponent_idx = (our_robot_idx === 0) ? 1 : 0;
            const our_robot_name = robot_names[our_robot_idx];
            const opponent_robot_name = robot_names[opponent_idx];
            const our_win_status = win_statuses[our_robot_idx];
            const opponent_win_status = win_statuses[opponent_idx];

            const {data: prev, error: prev_error } = await supabaseAdmin.from('fights')
              .select('is_win, cage, fight_time')
              .eq('robot_name', our_robot_name)
              .eq('opponent_name', opponent_robot_name)
              .eq('competition', competition)
              .maybeSingle();

            if(prev_error) {
                console.error('Error fetching previous win status:', prev_error);
                continue;
            }

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

            const buttonId = $row.attr('id') ?? '';
            if(!buttonId){
              console.error('Error getting button id for row');
              continue;
            }
            const fight_time = await getDialogScheduledFor(page, buttonId, {
              our_robot_name,
              opponent_robot_name,
            }, 'TrueFinals');
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
              const { error } = await supabaseAdmin.from('fights').upsert(payload, { onConflict: 'robot_name, opponent_name, competition' });
              log('info', 'Inserted new fight for', { payload });
              if(error) {
                  console.error('Error updating supabase:', error);
                  continue;
              }
            }else{
              const isWinTransition = prev.is_win == null && is_win != null;
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
 */
export async function runScrapeTrueFinals() {
  log('info', 'Fetching 12lb exhibition (Puppeteer)...');
  await withTournamentPage(BASE_URL_12LB, 'button[id^="game-EX-"]', async (page) => {
    await scrapeTrueFinals(cheerio.load(await page.content()), page);
  });

  log('info', 'Fetching 3lb exhibition (Puppeteer)...');
  await withTournamentPage(BASE_URL_3LB, 'button[id^="game-EX-"]', async (page) => {
    await scrapeTrueFinals(cheerio.load(await page.content()), page);
  });
}
