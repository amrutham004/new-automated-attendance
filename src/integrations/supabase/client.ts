import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a placeholder client if environment variables are missing
// This allows the app to load, but auth operations will fail gracefully
let supabase: SupabaseClient;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  console.warn('Supabase environment variables not found. Backend features will be unavailable.');
  // Create a mock client that will gracefully fail
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export { supabase };
export type AppRole = 'student' | 'teacher';
