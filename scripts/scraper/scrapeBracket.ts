/**
 * TrueFinals bracket (tournament root) scraper: 12lb and 3lb bracket pages via Puppeteer + Cheerio,
 * same flow as exhibition scraper but `game-*` row buttons (not `game-EX-*`) and distinct `competition` suffix.
 */
import * as cheerio from 'cheerio';
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

/** Brackets 12lb tournament root URL. */
const BASE_URL_12LB = 'https://truefinals.com/tournament/nhrl_may26_12lb/';
/** Brackets 3lb tournament root URL. */
const BASE_URL_3LB = 'https://truefinals.com/tournament/nhrl_may26_3lb/';

const BRACKET_ROW_SELECTOR = 'button[id^="game-"]';

async function scrapeBracket($: cheerio.CheerioAPI, page: Page) {
  try {
    const titleRaw = $('body')
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
    const competition = `${titleRaw.trim()} (bracket)`;

    const rows = $(BRACKET_ROW_SELECTOR);
    for (let i = 0; i < rows.length; i++) {
      const $row = $(rows[i]);
      log('info', `[Bracket] row ${i + 1}/${rows.length} ${$row.attr('id') ?? ''}`);

      const $cage_time_container = $row.children().first();
      const cage_number = $cage_time_container.children().eq(2).children().first().text();
      const cage = cage_number ? parseInt(cage_number.replace(/^C/i, ''), 10) : null;
      const $robot_info_container = $row.children().eq(1);
      const robot_names: string[] = [];
      const win_statuses: string[] = [];
      $robot_info_container.children('div[id^="slot-"]').each((_, slot) => {
        const $slot = $(slot);
        const temp_name = $slot.children().first().children().first().children().first().text();
        robot_names.push(temp_name);
        const temp_win = $slot.children().eq(1).text();
        win_statuses.push(temp_win);
      });

      const our_robot_idx = robot_names.findIndex((name) =>
        (CRC_ROBOTS as readonly string[]).includes(name),
      );
      if (our_robot_idx === -1) {
        continue;
      }
      const opponent_idx = our_robot_idx === 0 ? 1 : 0;
      const our_robot_name = robot_names[our_robot_idx];
      const opponent_robot_name = robot_names[opponent_idx];
      const our_win_status = win_statuses[our_robot_idx];
      const opponent_win_status = win_statuses[opponent_idx];

      const { data: prev, error: prev_error } = await supabaseAdmin
        .from('fights')
        .select('is_win, cage, fight_time')
        .eq('robot_name', our_robot_name)
        .eq('opponent_name', opponent_robot_name)
        .eq('competition', competition)
        .maybeSingle();

      if (prev_error) {
        console.error('Error fetching previous win status:', prev_error);
        continue;
      }

      let is_win: 'win' | 'lose' | null;
      if (our_win_status === '0' && opponent_win_status === '0') {
        is_win = null;
      } else {
        is_win = our_win_status === 'W' ? 'win' : 'lose';
      }

      const robot_id = await getRobotId(our_robot_name);
      if (robot_id === null) {
        log('info', `Robot "${our_robot_name}" not found in robots table, skipping fight`);
        continue;
      }

      const buttonId = $row.attr('id') ?? '';
      if (!buttonId) {
        console.error('Error getting button id for bracket row');
        continue;
      }

      const fight_time = await getDialogScheduledFor(
        page,
        buttonId,
        { our_robot_name, opponent_robot_name },
        'Bracket',
      );

      const payload = {
        robot_id,
        cage: !Number.isNaN(cage) ? cage : null,
        fight_time,
        is_win,
        robot_name: our_robot_name,
        opponent_name: opponent_robot_name,
        competition,
      };

      if (!prev) {
        const { error } = await supabaseAdmin
          .from('fights')
          .upsert(payload, { onConflict: 'robot_name, opponent_name, competition' });
        log('info', 'Inserted new bracket fight for', { payload });
        if (error) {
          console.error('Error updating supabase:', error);
          continue;
        }
      } else {
        const isWinTransition = prev.is_win == null && is_win != null;
        const wasAlreadyComplete = prev.is_win != null;
        const scheduleChanged = prev.fight_time !== fight_time || prev.cage !== cage;

        if (!isWinTransition && !scheduleChanged) {
          continue;
        }

        const { error } = await supabaseAdmin.from('fights').upsert(payload, {
          onConflict: 'robot_name, opponent_name, competition',
        });
        if (error) {
          console.error('Error updating supabase:', error);
          continue;
        }

        if (isWinTransition) {
          // await updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: true });
        } else if (!wasAlreadyComplete && scheduleChanged) {
          // await updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: false });
        }
      }
    }
  } catch (error) {
    console.error('Error scraping bracket:', error);
    throw error;
  }
}

export async function runScrapeBracket() {
  log('info', 'Fetching 12lb bracket (Puppeteer)...');
  await withTournamentPage(BASE_URL_12LB, BRACKET_ROW_SELECTOR, async (page) => {
    await scrapeBracket(cheerio.load(await page.content()), page);
  });

  log('info', 'Fetching 3lb bracket (Puppeteer)...');
  await withTournamentPage(BASE_URL_3LB, BRACKET_ROW_SELECTOR, async (page) => {
    await scrapeBracket(cheerio.load(await page.content()), page);
  });
}
