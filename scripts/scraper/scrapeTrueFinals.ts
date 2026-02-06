import axios from "axios"; //axios: js library for making HTTP requests
import * as cheerio from "cheerio"; //cheerio: js library for parsing HTML

//set up
const BASE_URL = 'https://truefinals.com/tournament/nhrl_feb26_12lb/exhibition'; //TODO: pass in tournament ID for future competitions
const response = await axios.get(BASE_URL, {timeout: 15_000}); 
const html = response.data;
const $ = cheerio.load(html); //$: function that wraps the HTML/DOM to use Cheerio methods

//TODO: repeated from scrapeBrettZone.ts -- clean up
const CRC_ROBOTS = [
    'Benny R. Johm',
    'Capsize',
    'Huey',
    'Apollo',
    'Jormangandr',
    'Unkulunkulu'
  ]

//workflow: scrape each fight, update DB once found
/*
HTML format:
<button type="button" id="game-EX-2fb9b326c7a34ed2-outer" class="...">
  <div class="relative isolate flex h-6...">
    <div ...>
    <div class="absolute bottom-[5px]...">
        <div class="skew-x-[27deg] scale-x-125">{CAGE NUMBER}</div>
    <div class="absolute bottom-[3px]...>{TIME INFORMATION}</div>
  <div class="relative box-border flex...">
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
$('button[id^="game"]').each((_, row) => {
    //wraps raw DOM node in Cheerio object to use Cheerio methods
    const $row = $(row);

    //TODO: change to children().first()
    const $cage_time_container = $row.children('div.relative.isolate.flex.h-6'); //TODO may need to be more specific
    const cage_number = $cage_time_container.children('div.absolute.bottom-[5px] div.skew-x-[27deg].scale-x-125').first().text();
    const fight_time = $cage_time_container.children('div.absolute.bottom-[3px]').first().text();

    const $robot_info_container = $row.children('div.relative.box-border.flex div[id^="slot"] ');
    $robot_info_container

});