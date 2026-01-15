import 'dotenv/config'
import axios from 'axios'
import cron from 'node-cron'
import fs from 'fs'
import path from 'path'
import { supabase } from '../../src/supabaseClient.ts'

const API_BASE_URL = 'https://brettzone.nhrl.io/brettZone/backend/fightsByBot.php'
//TODO: should have a competition season, and an off-season
const CRON_SCHEDULE = process.env.SCRAPER_CRON || '* * * * *' // default: every minute
const LOG_DIR = process.env.SCRAPER_LOG_DIR || path.resolve(process.cwd(), 'logs')
const LOG_FILE = process.env.SCRAPER_LOG_PATH || path.join(LOG_DIR, 'scraper.log')

const CRC_ROBOTS = [
  'Benny R. Johm',
  'Capsize',
  'Huey',
  'Apollo',
  'Jormangandr',
  'Unkulunkulu'
]

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
}

/**
 * Creates machine-readable logs in scraper.log (good for parsing/analysis).
 * Console output for quick debugging.
 */
function log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  ensureLogDir()
  const timestamp = new Date().toISOString()
  const payload = { timestamp, level, message, meta }
  fs.appendFileSync(LOG_FILE, JSON.stringify(payload) + '\n')
  // also print to stdout for dev
  console[level === 'error' ? 'error' : 'log'](`${timestamp} [${level}] ${message}`)
}

/**
 * Parse fight data from API JSON response. A clean-up fxn.
 * @param matches - Array of match objects from the API
 * @param ourRobotName - The name of the robot we're querying for (to determine opponent and win/loss)
 * 
 * API fields:
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
  //define fight fields
  //TODO: once fights are completed, we DON'T wanna waste time re-updating!!
  let fights: Array<{
    robot_name: string,
    opponent_name: string,
    cage: number | null,
    fight_time: number | null
    is_win: boolean | null
    fight_duration: number | null
    outcome_type: string | null
  }> = []

  fights = matches
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
      const isWin = isPlayer1 ? match.player1wins === '1' : match.player2wins === '1'
      const fightDuration = match.matchLength ? parseInt(match.matchLength) : null
      const outcomeType = match.winAnnotation

      return {
        robot_name: ourRobotName,
        opponent_name: opponentName,
        cage: cage,
        fight_time: fightTime,
        is_win: isWin,
        fight_duration: fightDuration,
        outcome_type: outcomeType,
      }
    })

  return fights
}

/**
 * Get robot_id from database. Throws if robot doesn't exist.
 * All robots CRC owns should already exist in the database.
 */
async function getRobotId(robotName: string): Promise<number> {
  /*
  data = [
    { robot_id: 42 }  // Array with one object
  ]
  */
  const { data, error } = await supabase
    .from('robots')
    .select('robot_id')
    .eq('robot_name', robotName)
    .limit(1)
  
  if(error) throw error
  if(data && data.length > 0) return data[0].robot_id
  throw new Error(`Robot ${robotName} not found`)
}

/**
 * @param f - fight object
 */
async function upsertFight(f: any) {
  try {
    const robot_id = await getRobotId(f.robot_name)
    const fight_time = f.fight_time || null //need to filter by fight_time cuz same robot might have multiple fights

    // try to find an existing fight by robot_id + fight_time
    // builds SQL query string
    let existingQuery = supabase.from('fights').select('fight_id').eq('robot_id', robot_id)
    if (fight_time) existingQuery = existingQuery.eq('fight_time', fight_time)
    // executes query and gets result
    const { data: existing, error: exErr } = await existingQuery.limit(1)
    if (exErr) throw exErr

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      ...f,
      last_updated: now
    }

    if (existing && existing.length > 0) {
      const fight_id = existing[0].fight_id
      // UPDATE fights SET <payload> WHERE fight_id = <fight_id>
      await supabase.from('fights').update(payload).eq('fight_id', fight_id)
      log('info', `Updated fight ${fight_id} for ${f.robot_name}`)
    } else {
      // no existing fight, so INSERT new one into DB
      const { error } = await supabase.from('fights').insert(payload)
      if (error) throw error
      log('info', `Inserted fight for ${f.robot_name} vs ${f.opponent_name || 'unknown'}`)
    }
  } catch (err: any) {
    log('error', 'upsertFight failed', { err: String(err), fight: f })
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

// CLI support: run once immediately with `npm run scrape -- --once` or `node ... --once`
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('scrapeBrettZone')

if (isMainModule) {
  const args = process.argv.slice(2)
  const runOnce = args.includes('--once') || args.includes('run-now')
  if (runOnce) {
    runScrape().then(() => process.exit(0)).catch(() => process.exit(1))
  } else {
    // Start scheduled job
    cron.schedule(CRON_SCHEDULE, () => {
      runScrape()
    })

    log('info', `Scheduler started (${CRON_SCHEDULE}). Target: ${API_BASE_URL}. Logs: ${LOG_FILE}`)
  }
}
