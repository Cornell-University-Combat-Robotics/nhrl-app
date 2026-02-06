import { createClient } from '@supabase/supabase-js';
import * as cheerio from "cheerio";
import 'dotenv/config';
import puppeteer from 'puppeteer';
import { createFightNotifBroadcast } from '../../src/notifications/sendPushNotif.ts';
import { log } from '../../src/utils/log.ts';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role key (for scraper, cron jobs, etc.)
// Only available when SUPABASE_SERVICE_ROLE_KEY is set (server-side only)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    realtime: {
        params: {
            eventsPerSecond: 10, // throttle events to max of 10 per sec -> ensures u don't overload system (e.g. if user spams buttton that changes DB)
        }
    }
    })

// TODO: scrape for huey too; pass tournament ID for future competitions
const BASE_URL_12LB = 'https://truefinals.com/tournament/nhrl_feb26_12lb/exhibition';
const BASE_URL_3LB = 'https://truefinals.com/tournament/nhrl_feb26_3lb/exhibition';

/** Fetch full HTML after JS has run (Option A: headless browser, then Cheerio). */
async function fetchHtmlWithPuppeteer(url: string): Promise<string> {
  const browser = await puppeteer.launch({ headless: true }); //launches headless browser
  try {
    const page = await browser.newPage(); //new tab in browser
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 }); //goes to URL and waits for DOM to load
    await page.waitForSelector('button[id^="game-EX-"]', { timeout: 25_000 }); //waits for button with id starting with "game-EX-" to load
    const html = await page.content(); //returns the HTML of the page
    return html;
  } finally {
    await browser.close();
  }
} 

//TODO: repeated from scrapeBrettZone.ts -- clean up
const CRC_ROBOTS = [
    'Benny R. Johm',
    'Capsize',
    'Huey',
/*     'Apollo',
    'Jormangandr',
    'Unkulunkulu' */
  ]

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
    <div ...>
    <div id="slot...">
        <div ...>
            <div ...>
                <div class="max-w-[168px]...">{ROBOT NAME 1}</div>
                ...info about results
*/
/*
- parse through HTML for each corresponding component (button with id)
- loop through each button (the container for each fight)
- "row": raw DOM node for each button
- .each: cheerio method
*/
//TODO: check if true finals updates more accurately than brettzone
async function scrapeTrueFinals($: cheerio.CheerioAPI) {
    try{
        console.log("=============DEBUG LOG: scrape true finals================");
        const rows = $('button[id^="game-EX-"]');
        console.log("rows length", rows.length);
        for(let i=0; i<rows.length; i++){
            //wraps raw DOM node in Cheerio object to use Cheerio methods
            const $row = $(rows[i]);

            //TODO: change to children().first()
            const $cage_time_container = $row.children().first(); //get first child of row, same as eq(0)
            //log('info', 'cage_time_container HTML', { html: $cage_time_container.html() });
            const cage_number = $cage_time_container.children().eq(2).children().first().text();
            const cage = cage_number ? parseInt(cage_number.replace(/^C/i, ''), 10) : null;
            const fight_time = $cage_time_container.children().eq(3).text();
            //log('info', 'fight_time element HTML', { html: $cage_time_container.children().eq(3).html() }); 

            const $robot_info_container = $row.children().eq(1);
            const robot_names : string[] = []; //same as robot_names = new Array<string>();
            $robot_info_container.children('div[id^="slot-EX-"]').each((_, slot) => {
                const $slot = $(slot);
                const temp_name = $slot.children().first().children().first().children().first().text();
                robot_names.push(temp_name);
            });
            /*
            console.log("=============DEBUG LOG================");
            console.log("robot_names", robot_names);
            console.log("cage_number", cage_number, "cage (parsed)", cage);
            console.log("fight_time", fight_time);
            */

            //identify robot vs opponent
            const our_robot_name = robot_names.find(name => CRC_ROBOTS.includes(name));
            if(!our_robot_name) {
                //not fight involving our robot, move on the next button component (next fight)
                continue;
            }
            const opponent_robot_name = robot_names.find(name => name !== our_robot_name);

            //update supabase
            const payload = {
                cage: !Number.isNaN(cage) ? cage : null,
                fight_time: fight_time,
                robot_name: our_robot_name,
                opponent_name: opponent_robot_name
            }
            //TODO: rn supabaseAdmin is from scrapeBrettZone.ts -- need to normalize
            const { error } = await supabaseAdmin.from('fights').insert(payload);
            if(error) {
                console.error('Error updating supabase:', error);
                continue;
            }
            await createFightNotifBroadcast(payload, supabaseAdmin);
        };
    }catch(error) {
        console.error('Error scraping True Finals:', error);
        throw error;
    }
}

// TESTING PURPOSES:  run once immediately with `npm run scrape -- --once`
// TODO: abstract out for both scrapers to use
const args = process.argv.slice(2);
const runOnce = args.includes('--once') || args.includes('run-now');

if (runOnce) {
  (async () => {
    try {
      log('info', 'Fetching 12lb exhibition (Puppeteer)...');
      const html_12LB = await fetchHtmlWithPuppeteer(BASE_URL_12LB);
      const $_12LB = cheerio.load(html_12LB);
      await scrapeTrueFinals($_12LB);

      log('info', 'Fetching 3lb exhibition (Puppeteer)...');
      const html_3LB = await fetchHtmlWithPuppeteer(BASE_URL_3LB);
      const $_3LB = cheerio.load(html_3LB);
      await scrapeTrueFinals($_3LB);

      log('info', 'Scrape completed successfully');
      process.exit(0);
    } catch (error) {
      log('error', 'Scrape failed', { error });
      process.exit(1);
    }
  })();
}