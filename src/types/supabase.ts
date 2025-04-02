
// This file defines TypeScript types for Supabase SDK

// Import types from supabase-js
import type { SupabaseClient } from '@supabase/supabase-js';
// Import Auth types from the correct location
import type { User, Session } from '@supabase/supabase-js/dist/module/lib/types';

// Re-export the types for use throughout the app
export type { User, Session };

export type TypedSupabaseClient = SupabaseClient;
