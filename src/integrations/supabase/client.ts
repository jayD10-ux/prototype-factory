
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lilukmlnbrzyjrksteay.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHVrbWxuYnJ6eWpya3N0ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2NTIwMzAsImV4cCI6MjA1NDIyODAzMH0.HP3oMkQ8RFFzRiklzOBrxcQ-PzX9HTlICqC5FkHNR6M";

// Create a basic client without auth configuration for compatibility with existing code
// This will be used when no authentication is available
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Create a client with custom auth configuration
export const createSupabaseClient = (options?: {
  authToken?: string;
}) => {
  const headers: Record<string, string> = {};
  
  if (options?.authToken) {
    headers['Authorization'] = `Bearer ${options.authToken}`;
  }
  
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers,
    },
    auth: {
      persistSession: false, // We're using Clerk to manage the session
      autoRefreshToken: false, // We'll handle token refresh with Clerk
    },
  });
};
