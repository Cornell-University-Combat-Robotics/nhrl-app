/**
 * BrettZone scraper: fetches fight data from the BrettZone API per CRC robot, parses responses,
 * and upserts into the fights table with push notification broadcasts on insert/update.
 */
import axios from 'axios';
import 'dotenv/config';
import type { Fight } from '../../src/db/fights.ts';
import { CRC_ROBOTS } from '../../src/db/robots.ts';
import { createFightNotifBroadcast, updateFightNotifBroadcast } from '../../src/notifications/sendPushNotif.ts';
import { formatTime } from '../../src/utils/formatTime.ts';
import { log } from '../../src/utils/log.ts';
import { getRobotId, supabaseAdmin } from './scraperHelper.js';

/** BrettZone API base URL; query with ?bot=<robotName>. Override via SCRAPER_TARGET_URL. */
const API_BASE_URL = process.env.SCRAPER_TARGET_URL || 'https://brettzone.nhrl.io/brettZone/backend/fightsByBot.php'

/**
 * Parse fight data from the BrettZone API JSON response into app Fight objects.
 * Filters out invalid matches (missing player1/player2) and normalizes win/loss from player1/player2 perspective.
 *
 * @param matches - Raw array of match objects from the API (e.g. response.data.fights). Each may have player1, player2, cage, startTime, matchLength, winAnnotation, tournamentName, player1wins, player2wins.
 * @param ourRobotName - The robot we're querying for; used to set robot_name, opponent_name, and is_win (our robot can be player1 or player2).
 * @returns Array of Fight-like objects with competition, robot_name, opponent_name, cage, fight_time (formatted), is_win ('win'|'lose'), fight_duration, outcome_type. Invalid matches are omitted.
 *
 * API fields used:
 * - tournamentName, cage ("Cage N"), player1, player2, player1wins ("1"/"0"), player2wins, winAnnotation (e.g. "JD", "TO", "KO"), matchLength (seconds), startTime (epoch seconds).
 *
 * Preconditions:
 * - ourRobotName must match exactly one of player1 or player2 in each valid match.
 * Invariants:
 * - Entries without player1 or player2 are skipped and logged as warnings.
 * - fight_time is produced by formatTime(parseInt(startTime)); cage is parsed from "Cage N".
 */
function parseFightsFromApi(matches: any[], ourRobotName: string) {

  const fights : Fight[] = matches
    .filter((match) => {
      //skips invalid arrays
      if(!match.player1 || !match.player2) {
        log('warn', 'skipping invalid match array', { match })
        return false //excludes match 
      }
      return true
    })
    .map((match) => {
      const isPlayer1 = match.player1 === ourRobotName
      const opponentName = isPlayer1 ? match.player2 : match.player1
      const cage = match.cage ? parseInt(match.cage.replace('Cage ', '')) : null
      const fightTime = match.startTime ? parseInt(match.startTime) : null
      const isWin = isPlayer1 ? (match.player1wins === '1' ? 'win' : 'lose') : (match.player2wins === '1' ? 'win' : 'lose')
      const fightDuration = match.matchLength ? parseInt(match.matchLength) : null
      const outcomeType = match.winAnnotation
      const competition = match.tournamentName

      return {
        competition: competition,
        robot_name: ourRobotName,
        opponent_name: opponentName,
        cage: cage,
        fight_time: formatTime(fightTime),
        is_win: isWin,
        fight_duration: fightDuration,
        outcome_type: outcomeType,
      }
    })

  return fights
}

/**
 * Insert or update a single fight in the fights table and send notifications when appropriate.
 * Resolves robot_name to robot_id, then upserts on (robot_name, opponent_name, competition).
 * Sends "New Fight" on insert; sends "Updated Fight" on update when is_win or other fields change (isWinUpdate when is_win changed).
 *
 * @param f - Fight-like object with robot_name, opponent_name, competition, cage, fight_time, is_win, fight_duration, outcome_type. Must have robot_name that exists in robots table.
 * @returns Promise that resolves when the upsert (and optional notification) completes. Rejects are caught and logged; the function does not rethrow.
 *
 * Preconditions:
 * - f.robot_name must exist in robots table (getRobotId returns non-null).
 * - Supabase fights table has unique constraint on (robot_name, opponent_name, competition).
 * Invariants:
 * - If the fight was already complete (is_win non-null in DB), no update notification is sent when only non-win fields change.
 * - last_updated is set to current time (formatTime of now).
 */
async function upsertFight(f: any) {
  try {
    const robot_id = await getRobotId(f.robot_name);
    if (robot_id === null) throw new Error(`Robot ${f.robot_name} not found`);
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      robot_id,
      ...f,
      last_updated: formatTime(now)
    }

    // Find existing by triplet (same as upsert conflict) to decide insert vs update and notif type
    const { data: existing, error: exErr } = await supabaseAdmin
      .from('fights')
      .select('fight_id, is_win, fight_time, cage')
      .eq('robot_name', f.robot_name)
      .eq('opponent_name', f.opponent_name ?? '')
      .eq('competition', f.competition)
      .maybeSingle()
    if (exErr) throw exErr

    const wasAlreadyComplete = existing?.is_win != null

    const { error: upsertErr } = await supabaseAdmin
      .from('fights')
      .upsert(payload, { onConflict: 'robot_name, opponent_name, competition' })
    if (upsertErr) throw upsertErr

    if (!existing) {
      await createFightNotifBroadcast(payload, supabaseAdmin)
      log('info', `Inserted fight for ${f.robot_name} vs ${f.opponent_name || 'unknown'}`)
    } else {
      //is_win NULL -> non-null is the "fight just concluded" signal -> Fight Result notif
      const isWinTransition = existing.is_win == null && payload.is_win != null
      //fight_time/cage updates while still incomplete -> Updated Fight notif
      const scheduleChanged =
        payload.fight_time !== existing.fight_time || payload.cage !== existing.cage

      if (isWinTransition) {
        await updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: true })
      } else if (!wasAlreadyComplete && scheduleChanged) {
        await updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: false })
      }
      log('info', `Updated fight ${existing.fight_id} for ${f.robot_name}`)
    }
  } catch (err: any) {
    const errorMessage = err?.message || err?.toString() || JSON.stringify(err)
    const errorDetails = err?.code || err?.details || err?.hint || ''
    log('error', 'upsertFight failed', {
      err: errorMessage,
      details: errorDetails,
      code: err?.code,
      fight: f
    })
  }
}

/**
 * Run the full BrettZone scrape: for each CRC robot, fetch fights from the BrettZone API,
 * parse them, and upsert each fight (with notifications). Logs progress and errors per robot and per fight.
 *
 * @returns Promise that resolves when all robots have been processed (individual fetch or upsert failures are logged but do not stop the loop).
 *
 * Preconditions:
 * - SCRAPER_TARGET_URL or default BrettZone URL is reachable; EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.
 * - CRC_ROBOTS names exist in robots table for fights to be stored.
 * Invariants:
 * - Robots are processed sequentially; within a robot, fights are upserted sequentially.
 * - Does not throw; errors are logged and the next robot/fight is processed.
 */
export async function runScrape() {
  log('info', `Scrape started for ${CRC_ROBOTS.length} robots`)

  for(const robotName of CRC_ROBOTS) {
    try{
      log('info', `Fetching fights for ${robotName}`)
      const url = `${API_BASE_URL}?bot=${encodeURIComponent(robotName)}`
      const response = await axios.get(url, {timeout: 15_000})

      if(!response.data) throw new Error('Failed to fetch fights')
      if(!response.data.fights || response.data.fights.length === 0) {
        log('info', `No fights found for ${robotName}`)
        continue
      }

      const fights = parseFightsFromApi(response.data.fights, robotName)
      log('info', `Parsed ${fights.length} fight(s) for ${robotName}`)

      for(const f of fights){
        try{
          await upsertFight(f)
        }catch(err: any){
          log('error', 'upsert per-fight failed', { err: String(err), fight: f })
        }
      }
    }catch(err: any){
      log('error', 'fetch fights from api failed', { err: String(err), robotName })
    }
  }

  log('info', 'Scrape finished for all robots')
}