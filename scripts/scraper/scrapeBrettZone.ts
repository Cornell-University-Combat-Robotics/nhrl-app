import 'dotenv/config'
import axios from 'axios'
import cron from 'node-cron'
import { getCron } from '../../src/db/cron.ts'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { formatTime } from '../../src/utils/formatTime.ts'
import { createFightNotifBroadcast, updateFightNotifBroadcast } from '../../src/notifications/sendPushNotif.ts'

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

//TODO: on expo side, also make sure that any edits are server side
const API_BASE_URL = process.env.SCRAPER_TARGET_URL || 'https://brettzone.nhrl.io/brettZone/backend/fightsByBot.php'
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
      const isWin = isPlayer1 ? (match.player1wins === '1' ? 'win' : 'lose') : (match.player2wins === '1' ? 'win' : 'lose')
      const fightDuration = match.matchLength ? parseInt(match.matchLength) : null
      const outcomeType = match.winAnnotation

      //TODO check against Fight interface in fights.ts
      return {
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
 * Get robot_id from database. Throws if robot doesn't exist.
 * All robots CRC owns should already exist in the database.
 */
async function getRobotId(robotName: string): Promise<number> {
  /*
  data = [
    { robot_id: 42 }  // Array with one object
  ]
  */
  const { data, error } = await supabaseAdmin
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

    //TODO: logic prob wrong- --might cause duplicates
    //TODO: webscraping should not run on fights already completed 
    // try to find an existing fight by robot_id + fight_time
    // builds SQL query string
    let existingQuery = supabaseAdmin.from('fights').select('fight_id, is_win').eq('robot_id', robot_id)
    if (fight_time) existingQuery = existingQuery.eq('fight_time', fight_time)
    // executes query and gets result
    const { data: existing, error: exErr } = await existingQuery.limit(1)
    if (exErr) throw exErr
    
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      robot_id: robot_id,
      ...f,
      last_updated: formatTime(now)
    }

    if (existing && existing.length > 0) {
      const fight_id = existing[0].fight_id
      const wasAlreadyComplete = existing[0].is_win != null
      // UPDATE fights SET <payload> WHERE fight_id = <fight_id>
      const { error } = await supabaseAdmin.from('fights').update(payload).eq('fight_id', fight_id)
      if(error) throw error
      // Only broadcast when fight just completed (was incomplete, now has result)
      if (!wasAlreadyComplete) {
        if(payload.is_win === null) {
          updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: false });
        }else{
          updateFightNotifBroadcast(payload, supabaseAdmin, { isWinUpdate: true });
        } 
      }
      log('info', `Updated fight ${fight_id} for ${f.robot_name}`)
    } else {
      // no existing fight, so INSERT new one into DB
      //NOTE: cannot use useCreateFight hook here because React hooks must be used in React components -- scrper is a Node script
      const { error } = await supabaseAdmin.from('fights').insert(payload)
      if (error) throw error
      createFightNotifBroadcast(payload, supabaseAdmin);
      log('info', `Inserted fight for ${f.robot_name} vs ${f.opponent_name || 'unknown'}`)
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


/* Handle CRON scheduler */

//active cron task
let activeTask: cron.ScheduledTask | null = null;

/** Load & schedule jobs from database */
async function loadAndScheduleJobs() {
  console.log('Loading and scheduling jobs...');

  try{
    const cron_data = await getCron(supabaseAdmin); 
    if(cron_data && cron_data.length > 0) {
      const cron_schedule = cron_data[0].cron_schedule;

      //stop current scraper task
      if(activeTask) {
        activeTask.stop();
      }

      //start all tasks again
      activeTask = cron.schedule(cron_schedule, async () => {
        console.log('Running scraper task...');
        await runScrape();
      });

      console.log(`[SCHEDULER STARTED] ${cron_schedule}`);
    }else{
      throw new Error('No cron data found');
    }
  }catch(error){
    console.error('Error loading and scheduling jobs:', error);
  }
}

/** Set up Supabase Realtime subscription */
function setupRealtimeSubscription() {
  console.log('Setting up realtime subscription');

  const channel = supabaseAdmin
    .channel('cron-config-changes') //create a name of the channel to listen to
    .on(
      'postgres_changes',
      {
        event: '*', //all types of events (insert, update, delete)
        schema:'public', 
        table: 'cron' //name of the table to listen to
      },
      (payload) => {
        //payload: data that was changed
        console.log('Cron config changed:', payload);
        //payload example: { event: 'INSERT', schema: 'public', table: 'cron', data: { cron_schedule: '0 2 * * *' } }
        
        //load and schedule jobs again, using the updated cron schedule
        loadAndScheduleJobs();
      }
    )
    .subscribe((status) => {
      if(status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to cron-config-changes channel');
      } else {
        console.error('Failed to subscribe to cron-config-changes channel:', status);
      }
    });

    return channel;
}

/** Startup of scheduler scraping service */
async function start(){
  console.log('Starting realtime dynamic cron server...');
  console.log('Time:', new Date().toISOString());
  
  //initial load of schedules
  await loadAndScheduleJobs();

  //subscribe to realtime changes in db
  const channel = setupRealtimeSubscription();

  console.log('\n✨ Server is running!');
  console.log('👂 Listening for database changes in real-time...\n');

  //graceful shutdown when interrupted
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    
    // Stop all cron jobs
    if(activeTask) {
      activeTask.stop();
    }

    //to be safe, unsubscribe from the channel
    channel.unsubscribe();
    console.log('Server shutdown complete');
    
    process.exit(0);
  });
}



// TESTING PURPOSES:  run once immediately with `npm run scrape -- --once`
const args = process.argv.slice(2);
const runOnce = args.includes('--once') || args.includes('run-now');

if (runOnce) {
  // Run once and exit (for GitHub Actions, manual runs, etc.)
  runScrape()
    .then(() => {
      log('info', 'Scrape completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      log('error', 'Scrape failed', { error });
      process.exit(1);
    });
} else {
  // Start the realtime subscription service: npm run scrape
  start().catch(error => {
    log('error', 'Error starting scheduler', { error });
    process.exit(1);
  });
}