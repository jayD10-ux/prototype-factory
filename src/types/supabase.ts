
// This file defines TypeScript types for Supabase SDK

// Import types correctly from gotrue-js
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User as AuthUser, Session as AuthSession } from '@supabase/gotrue-js';

// Re-export the types for use throughout the app
export type User = AuthUser;
export type Session = AuthSession;

export type TypedSupabaseClient = SupabaseClient;
