// ============================================================
//  src/db/supabase.js — Supabase Database Connection
//  Two clients:
//  1. supabase — for general queries (uses anon key)
//  2. supabaseAdmin — for admin operations (uses service key, bypasses RLS)
// ============================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase environment variables. Check your .env file.');
    process.exit(1);
}

// Regular client — respects RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client — bypasses RLS (use only in backend/server-side)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession:   false,
    }
});

module.exports = { supabase, supabaseAdmin };