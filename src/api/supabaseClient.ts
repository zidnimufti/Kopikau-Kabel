import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database'; // Kita akan buat file ini nanti

// Ambil environment variables dari file .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in .env.local");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
