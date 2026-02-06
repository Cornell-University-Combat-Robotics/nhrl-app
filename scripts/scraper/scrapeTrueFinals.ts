import { log } from '../../src/utils/log.ts';
import axios from "axios"; //axios: js library for making HTTP requests
import * as cheerio from "cheerio"; //cheerio: js library for parsing HTML
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

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

//set up
//TODO: scrape for huey too
const BASE_URL_12LB = 'https://truefinals.com/tournament/nhrl_feb26_12lb/exhibition'; //TODO: pass in tournament ID for future competitions
const BASE_URL_3LB = 'https://truefinals.com/tournament/nhrl_feb26_3lb/exhibition';
const response_12LB = await axios.get(BASE_URL_12LB, {timeout: 15_000}); 
const response_3LB = await axios.get(BASE_URL_3LB, {timeout: 15_000}); 
const html_12LB = response_12LB.data;
const html_3LB = response_3LB.data;
const $_12LB = cheerio.load(html_12LB); //$_12LB: function that wraps the HTML/DOM to use Cheerio methods
const $_3LB = cheerio.load(html_3LB); 

//TODO: repeated from scrapeBrettZone.ts -- clean up
const CRC_ROBOTS = [
    'Benny R. Johm',
    'Capsize',
    'Huey',
/*     'Apollo',
    'Jormangandr',
    'Unkulunkulu' */
  ]

  
//workflow: scrape each fight, update DB once found
/*
HTML format:
<button type="button" id="game-EX-2fb9b326c7a34ed2-outer" class="...">
  <div class="relative isolate flex h-6..."> (CAGE TIME CONTAINER)
    <div ...>
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
        const rows = $('button[id^="game-EX-"]');

        for(let i=0; i<rows.length; i++){
            //wraps raw DOM node in Cheerio object to use Cheerio methods
            const $row = $(rows[i]);

            //TODO: change to children().first()
            const $cage_time_container = $row.children().first(); //get first child of row, same as eq(0)
            const cage_number = $cage_time_container.children().eq(1).children().first().text(); 
            const fight_time = $cage_time_container.children().eq(2).text(); 

            const $robot_info_container = $row.children().eq(1);
            const robot_names : string[] = []; //same as robot_names = new Array<string>();
            $robot_info_container.children('div[id^="slot-EX-"]').each((_, slot) => {
                const $slot = $(slot);
                const temp_name = $slot.children().first().children().first().children().first().text();
                robot_names.push(temp_name);
            });
            console.log("=============DEBUG LOG================");
            console.log("robot_names", robot_names);
            console.log("cage_number", cage_number);
            console.log("fight_time", fight_time);

            //identify robot vs opponent
            const our_robot_name = robot_names.find(name => CRC_ROBOTS.includes(name));
            if(!our_robot_name) {
                //not fight involving our robot, move on the next button component (next fight)
                continue;
            }
            const opponent_robot_name = robot_names.find(name => name !== our_robot_name);

            //update supabase
            const payload = {
                cage: cage_number,
                fight_time: fight_time,
                robot_name: our_robot_name,
                opponent_name: opponent_robot_name,
            }
            //TODO: rn supabaseAdmin is from scrapeBrettZone.ts -- need to normalize
            const { error } = await supabaseAdmin.from('fights').insert(payload);
            if(error) {
                console.error('Error updating supabase:', error);
                continue;
            }
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
  // Run once and exit (for GitHub Actions, manual runs, etc.)
  console.log("scraping 12lb");
  scrapeTrueFinals($_12LB)
    .then(() => {
      log('info', 'Scrape completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      log('error', 'Scrape failed', { error });
      process.exit(1);
    });

    console.log("scraping 3lb");
    scrapeTrueFinals($_3LB)
      .then(() => {
        log('info', 'Scrape completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        log('error', 'Scrape failed', { error });
        process.exit(1);
      });
}