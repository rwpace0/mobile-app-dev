import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Add error checking and debug logging
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials. Application terminated.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);