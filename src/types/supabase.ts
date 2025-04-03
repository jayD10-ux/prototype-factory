
// This file defines TypeScript types for Supabase SDK

// Import types from supabase-js
import type { SupabaseClient } from '@supabase/supabase-js';

// We need to explicitly define the auth-related types since we're having issues with imports
export interface User {
  id: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    [key: string]: any;
  };
  aud: string;
  email?: string;
  phone?: string;
  created_at: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  role?: string;
  updated_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number; // Make expires_at optional to match Supabase's type
  expires_in: number;
  user: User;
}

export type TypedSupabaseClient = SupabaseClient;
