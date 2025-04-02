
// This file defines TypeScript types for Supabase SDK

// Import types from supabase-js
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

// Re-export the types for use throughout the app
export type { User, Session };

export type TypedSupabaseClient = SupabaseClient;
