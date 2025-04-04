
import { supabase } from './client';
import { useClerk, useAuth, useUser } from '@clerk/clerk-react';

/**
 * This adapter ensures that Supabase client can be used with Clerk auth
 * In the future, we will set up JWT token passing from Clerk to Supabase
 */
export function useSupabaseWithClerkAuth() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  
  return {
    user,
    isAuthenticated: isSignedIn,
    supabase
  };
}

/**
 * In the future, this function will set up JWT authentication between Clerk and Supabase
 */
export async function authorizedSupabaseClient() {
  // For now, just return the regular client
  // In phase 2, we will implement JWT token passing
  return supabase;
}
