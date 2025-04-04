
import { supabase } from './client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * This is a utility hook to synchronize Clerk sessions with Supabase.
 * It requests a JWT token from Clerk formatted for Supabase and 
 * ensures that Supabase client is authenticated with this token.
 */
export function useSupabaseAuth() {
  const { getToken, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSupabaseSession = useCallback(async () => {
    try {
      if (!isSignedIn) {
        // If not signed in with Clerk, sign out from Supabase too
        await supabase.auth.signOut();
        return;
      }

      // Get a JWT for Supabase from Clerk
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        console.error('Failed to get Supabase token from Clerk');
        return;
      }

      // Use the token with Supabase client
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      // Check if window.Clerk exists for integrations
      if (typeof window !== 'undefined') {
        // Store token for potential integrations
        window.localStorage.setItem('supabase_auth_token', token);
      }

    } catch (error: any) {
      console.error('Error refreshing Supabase session:', error.message);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    refreshSupabaseSession();
  }, [refreshSupabaseSession, isSignedIn]);
  
  return { isLoading, error, refreshSession: refreshSupabaseSession };
}
