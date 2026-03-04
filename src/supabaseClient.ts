import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Create admin client with service role key for database operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    }
})

//DO NOT define supabaseAdmin here -> only use in scripts/scraper/scrapeBrettZone.ts, because everything here will be shipped when expo starts,
//and we don't want to expose the service role key to the client

if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        console.log('[Auth] AppState active -> startAutoRefresh');
        supabase.auth.startAutoRefresh();
      } else {
        console.log('[Auth] AppState', state, '-> stopAutoRefresh');
        supabase.auth.stopAutoRefresh();
      }
    });
  }