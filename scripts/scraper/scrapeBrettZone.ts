import 'dotenv/config'
import axios from 'axios'
import cheerio from 'cheerio'
import cron from 'node-cron'
import fs from 'fs'
import path from 'path'
import { supabase } from '../../src/supabaseClient'

const TARGET_URL = process.env.SCRAPER_TARGET_URL || 'https://brettzone.nhrl.io/brettZone/'
const CRON_SCHEDULE = process.env.SCRAPER_CRON || '0 2 * * *' // default: daily at 02:00
const LOG_DIR = process.env.SCRAPER_LOG_DIR || path.resolve(process.cwd(), 'logs')
const LOG_FILE = process.env.SCRAPER_LOG_PATH || path.join(LOG_DIR, 'scraper.log')

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
}

function log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  ensureLogDir()
  const timestamp = new Date().toISOString()
  const payload = { timestamp, level, message, meta }
  fs.appendFileSync(LOG_FILE, JSON.stringify(payload) + '\n')
  // also print to stdout for dev
  console[level === 'error' ? 'error' : 'log'](`${timestamp} [${level}] ${message}`)
}

async function fetchHtml(url: string) {
  const r = await axios.get(url, { timeout: 15_000 })
  return r.data as string
}

/**
 * Parse fight entries from brettZone page HTML.
 * NOTE: The real site structure may change; adjust selectors accordingly.
 * Basic extraction patterns (essential fields only):
 * - Robot name
 * - Opponent name
 * - Cage number (if present)
 * - Fight time (parse to epoch seconds if present)
 * - Outcome (text -> is_win + outcome_type)
 * - Duration (seconds)
 */
function parseFights(html: string) {
  const $ = cheerio.load(html)
  const fights: Array<any> = []

  // Heuristic selectors: try common patterns, fallback gracefully
  const entrySelectors = ['.fight', '.match', '.bout', '.fight-entry', '.result'].join(', ')

  $(entrySelectors).each((_, el) => {
    const root = $(el)

    // Try a few selectors for robot/opponent names
    const robotName = (root.find('.robot, .our-robot, .bot-name, .name').first().text() || '').trim()
    const opponentName = (root.find('.opponent, .their-robot, .opp-name, .opponent-name').first().text() || '').trim()

    // cage/floor/arena number
    const cageText = (root.find('.cage, .arena, .ring, .stage').first().text() || '').trim()
    const cage = parseInt((cageText.match(/\d+/) || [])[0] || '0', 10) || null

    // fight time - try data attributes or visible timestamps
    let fightTime: number | null = null
    const timeAttr = root.attr('data-time') || root.find('time').attr('datetime') || root.find('.time').text()
    if (timeAttr) {
      const parsed = Date.parse(timeAttr)
      if (!isNaN(parsed)) fightTime = Math.floor(parsed / 1000)
    }

    // outcome parsing
    const outcomeText = (root.find('.outcome, .result-text, .result').first().text() || '').trim()
    let is_win: boolean | null = null
    let outcome_type: string | null = null
    if (outcomeText) {
      const t = outcomeText.toLowerCase()
      if (t.includes('win') || t.includes('winner') || t.includes('ko') || t.includes('tap')) is_win = true
      else if (t.includes('lose') || t.includes('loss') || t.includes('defeat')) is_win = false

      if (t.includes('ko')) outcome_type = 'KO'
      else if (t.includes('judge') || t.includes('decision')) outcome_type = 'Judges Decision'
      else if (t.includes('tap')) outcome_type = 'Tapout'
      else if (!outcome_type && t) outcome_type = outcomeText
    }

    // duration parsing (mm:ss or seconds)
    let fightDuration: number | null = null
    const durText = (root.find('.duration, .time, .fight-duration').first().text() || '').trim()
    const mmss = durText.match(/(\d+):(\d{2})/)
    if (mmss) {
      fightDuration = parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10)
    } else {
      const sec = (durText.match(/(\d+)s/) || [])[1]
      if (sec) fightDuration = parseInt(sec, 10)
    }

    // minimal validation: must have robotName and opponentName or robotName and time
    if (robotName) {
      fights.push({ robotName, opponentName: opponentName || null, cage, fightTime, is_win, fightDuration, outcome_type })
    }
  })

  // If no entries matched, try a fallback: scan table rows
  if (fights.length === 0) {
    $('table tr').each((_, tr) => {
      const cols = $(tr).find('td')
      if (cols.length >= 2) {
        const robotName = $(cols[0]).text().trim()
        const opponentName = $(cols[1]).text().trim()
        if (robotName) fights.push({ robotName, opponentName, cage: null, fightTime: null, is_win: null, fightDuration: null, outcome_type: null })
      }
    })
  }

  return fights
}

async function getOrCreateRobot(robotName: string) {
  try {
    const { data, error } = await supabase.from('robots').select('robot_id').eq('robot_name', robotName).limit(1)
    if (error) throw error
    if (data && data.length > 0) return data[0].robot_id

    const insertRes = await supabase.from('robots').insert({ robot_name: robotName }).select('robot_id').limit(1)
    if (insertRes.error) throw insertRes.error
    return insertRes.data[0].robot_id
  } catch (err: any) {
    log('error', `getOrCreateRobot failed for ${robotName}`, { err: String(err) })
    throw err
  }
}

async function upsertFight(f: any) {
  try {
    const robot_id = await getOrCreateRobot(f.robotName)
    const fight_time = f.fightTime || null

    // try to find an existing fight by robot_id + fight_time + cage
    let existingQuery = supabase.from('fights').select('fight_id,last_updated').eq('robot_id', robot_id)
    if (fight_time) existingQuery = existingQuery.eq('fight_time', fight_time)
    if (f.cage) existingQuery = existingQuery.eq('cage', f.cage)
    const { data: existing, error: exErr } = await existingQuery.limit(1)
    if (exErr) throw exErr

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      robot_id,
      opponent_name: f.opponentName,
      cage: f.cage,
      fight_time,
      last_updated: now,
      is_win: f.is_win,
      fight_duration: f.fightDuration,
      outcome_type: f.outcome_type
    }

    if (existing && existing.length > 0) {
      const fight_id = existing[0].fight_id
      await supabase.from('fights').update(payload).eq('fight_id', fight_id)
      log('info', `Updated fight ${fight_id} for ${f.robotName}`)
    } else {
      const { error: insErr } = await supabase.from('fights').insert(payload)
      if (insErr) throw insErr
      log('info', `Inserted fight for ${f.robotName} vs ${f.opponentName || 'unknown'}`)
    }
  } catch (err: any) {
    log('error', 'upsertFight failed', { err: String(err), fight: f })
  }
}

export async function runScrape() {
  log('info', `Scrape started for ${TARGET_URL}`)
  try {
    const html = await fetchHtml(TARGET_URL)
    const fights = parseFights(html)
    log('info', `Parsed ${fights.length} fight(s)`)

    for (const f of fights) {
      try {
        await upsertFight(f)
      } catch (err) {
        log('error', 'upsert per-fight failed', { err: String(err), fight: f })
      }
    }

    log('info', `Scrape finished for ${TARGET_URL}`)
  } catch (err: any) {
    log('error', `Scrape failed: ${err?.message || String(err)}`)
  }
}

// CLI support: run once immediately with `npm run scrape -- --once` or `node ... --once`
if (require.main === module) {
  const args = process.argv.slice(2)
  const runOnce = args.includes('--once') || args.includes('run-now')
  if (runOnce) {
    runScrape().then(() => process.exit(0)).catch(() => process.exit(1))
  } else {
    // Start scheduled job
    cron.schedule(CRON_SCHEDULE, () => {
      runScrape()
    })

    log('info', `Scheduler started (${CRON_SCHEDULE}). Target: ${TARGET_URL}. Logs: ${LOG_FILE}`)
  }
}
