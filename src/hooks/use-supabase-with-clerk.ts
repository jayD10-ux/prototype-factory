
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase as defaultClient, createSupabaseClient } from '@/integrations/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export function useSupabaseWithClerk() {
  const { getToken, isSignedIn, userId } = useAuth();
  const [client, setClient] = useState<SupabaseClient<Database>>(defaultClient);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeClient = async () => {
      setIsLoading(true);
      
      if (isSignedIn) {
        try {
          // Request a JWT with the 'supabase' template
          // This gets a token formatted for Supabase authentication
          const token = await getToken({ template: 'supabase' });
          
          if (token) {
            // Create a new Supabase client with the auth token
            const newClient = createSupabaseClient({ authToken: token });
            setClient(newClient);
            console.log('Supabase client initialized with Clerk token');
          }
        } catch (error) {
          console.error('Failed to initialize authenticated Supabase client:', error);
        }
      } else {
        // Use the default client for anonymous users
        setClient(defaultClient);
      }
      
      setIsLoading(false);
    };

    initializeClient();
  }, [getToken, isSignedIn]);

  return { 
    supabase: client, 
    isLoading, 
    isAuthenticated: isSignedIn,
    clerkId: userId, // Add clerkId for convenience
  };
}
