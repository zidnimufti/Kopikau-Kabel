import { createClient } from '@supabase/supabase-js';

// Ambil environment variables dari file .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,       // <-- penting agar sesi tersimpan di localStorage
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});