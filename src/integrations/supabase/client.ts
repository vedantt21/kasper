import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("Supabase URL:", SUPABASE_URL);
console.log("Supabase Key:", SUPABASE_PUBLISHABLE_KEY);

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Supabase environment variables are missing!");
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  { auth: { storage: localStorage, persistSession: true, autoRefreshToken: true } }
);
