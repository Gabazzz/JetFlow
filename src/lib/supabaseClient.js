import { createClient } from '@supabase/supabase-js';

// These are the project's public URL + publishable (anon) key — safe to ship
// in the client bundle by design. Real access control lives entirely in
// Postgres Row Level Security (every table is scoped to auth.uid()), not in
// keeping these values secret.
export const SUPABASE_URL = 'https://lgrusomfgvblcsgbiwdb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mZyeXeromGAYrELsvRJCIQ_Ag0dmy9f';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
