
// This file defines TypeScript types for Supabase SDK

// Import types from supabase-js
import type { SupabaseClient } from '@supabase/supabase-js';

// Re-export the types for use throughout the app
// Note: In Supabase v2, User and Session are accessed from auth-js which is included in supabase-js
export type { User, Session } from '@supabase/supabase-js/dist/module/lib/types';

export type TypedSupabaseClient = SupabaseClient;
