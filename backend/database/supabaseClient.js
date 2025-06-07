import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Add error checking and debug logging
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials. Application terminated.');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase service role key. Application terminated.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a client with the service role key for admin operations
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export function getClientToken(token) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}
