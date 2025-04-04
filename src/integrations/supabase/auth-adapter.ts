
import { supabase } from './client';
import { useClerk, useAuth, useUser } from '@clerk/clerk-react';

/**
 * This adapter ensures that Supabase client can be used with Clerk auth
 * It passes JWT tokens from Clerk to Supabase
 */
export function useSupabaseWithClerkAuth() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  
  const getSupabaseWithAuth = async () => {
    if (!isSignedIn) return supabase;
    
    const token = await getToken({ template: 'supabase' });
    if (!token) return supabase;
    
    return supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed with Clerk's token
    });
  };
  
  return {
    user,
    isAuthenticated: isSignedIn,
    getSupabaseWithAuth
  };
}

/**
 * Gets a Supabase client with Clerk JWT authentication 
 */
export async function authorizedSupabaseClient() {
  const clerk = window.Clerk;
  if (!clerk || !clerk.session) {
    return supabase;
  }
  
  try {
    const token = await clerk.session.getToken({ template: 'supabase' });
    if (!token) return supabase;
    
    const { data } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
    
    return data.session ? supabase : supabase;
  } catch (error) {
    console.error('Error getting authorized Supabase client:', error);
    return supabase;
  }
}
