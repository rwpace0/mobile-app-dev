import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Add error checking
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);