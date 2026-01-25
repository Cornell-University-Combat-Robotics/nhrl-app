import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Create admin client with service role key for database operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
})

//DO NOT define supabaseAdmin here -> only use in scripts/scraper/scrapeBrettZone.ts, because everything here will be shipped when expo starts,
//and we don't want to expose the service role key to the client