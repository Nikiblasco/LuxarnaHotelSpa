import { createClient } from '@supabase/supabase-js';

// These pull from the "Secrets" tool we discussed earlier
const supabaseUrl = process.env['SUPABASE_URL'] || '';
const supabaseKey = process.env['SUPABASE_ANON_KEY'] || '';

export const supabase = createClient(supabaseUrl, supabaseKey);