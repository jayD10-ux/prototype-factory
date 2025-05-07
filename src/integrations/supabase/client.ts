
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lilukmlnbrzyjrksteay.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHVrbWxuYnJ6eWpya3N0ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2NTIwMzAsImV4cCI6MjA1NDIyODAzMH0.HP3oMkQ8RFFzRiklzOBrxcQ-PzX9HTlICqC5FkHNR6M";

// Create a properly configured client with auth settings
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  },
});

// Export the base client for compatibility
export const createSupabaseClient = () => supabase;
