
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing! Check your .env setup.');
}


let supabaseInstance;

try {
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseAnonKey || 'placeholder-key';

  // Basic validation to prevent synchronous crash
  if (!url.startsWith('http')) {
    throw new Error('Supabase URL must start with http/https');
  }

  supabaseInstance = createClient(url, key);
} catch (error) {
  console.error("CRITICAL: Supabase initialization failed. Using placeholder to prevent crash.", error);
  supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export const supabase = supabaseInstance;
