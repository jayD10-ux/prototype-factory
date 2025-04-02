
// This file defines TypeScript types for Supabase SDK
import { SupabaseClient } from '@supabase/supabase-js';

// Re-export the types correctly, using type import to avoid runtime issues
export type { User, Session } from '@supabase/supabase-js';

export type TypedSupabaseClient = SupabaseClient;
