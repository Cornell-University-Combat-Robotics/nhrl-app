import axios from 'axios';
import 'dotenv/config';
import path from 'path';
import type { Fight } from '../../src/db/fights.ts';
import { createFightNotifBroadcast, updateFightNotifBroadcast } from '../../src/notifications/sendPushNotif.ts';
import { formatTime } from '../../src/utils/formatTime.ts';
import { log } from '../../src/utils/log.ts';
import { getRobotId, supabaseAdmin } from './scraperHelper.js';
import { CRC_ROBOTS } from './scraperHelper.js';

const API_BASE_URL = process.env.SCRAPER_TARGET_URL || 'https://brettzone.nhrl.io/brettZone/backend/fightsByBot.php'

/**
 * Parse fight data from API JSON response. A clean-up fxn.
 * @param matches - Array of match objects from the API
 * @param ourRobotName - The name of the robot we're querying for (to determine opponent and win/loss)
 * 
 * API fields:
 * - "tournamentName": "NHRL February 2026 12lb"
 * - "cage": "Cage 4"
 * - "player1": "Carmen", "player1clean": "carmen"
 * - "player2": "Benny R. Johm", "player2clean": "bennyrjohm"
 * - "player1wins": "1", "player2wins": "0"
 * - "winAnnotation": "JD" (Judges Decision), "TO" (Tapout), "KO" (Knockout)
 * - "matchLength": "180" (in seconds)
 * - "startTime": "1746299570" (epoch seconds)
 * 
 * Note: our robot could be either player1 or player2
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
 * @param f - fight object
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
      .select('fight_id, is_win')
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
      if (!wasAlreadyComplete) {
        if (payload.is_win === null) {
          await updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: false })
        } else {
          await updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: true })
        }
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