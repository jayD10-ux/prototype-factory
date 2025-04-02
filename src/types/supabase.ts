
// This file defines TypeScript types for Supabase SDK

// Import types correctly - use type keyword to avoid runtime issues
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';

// Re-export the types for use throughout the app
export type { User, Session };

export type TypedSupabaseClient = SupabaseClient;
