
'use client';

import { createContext, useContext } from 'react';
import { useSupabaseWithClerk } from '@/hooks/use-supabase-with-clerk';
import { useUser } from '@clerk/clerk-react';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

interface SupabaseContextType {
  supabase: SupabaseClient<Database>;
  isAuthenticated: boolean;
  session: {
    user: {
      id: string;
      email?: string;
    };
  } | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const { supabase, isAuthenticated } = useSupabaseWithClerk();
  const { user, isLoaded } = useUser();

  // Create a session-like object from Clerk user data
  // This maintains compatibility with code that expects supabase.auth.session
  const session = isLoaded && user ? {
    user: {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress
    }
  } : null;

  return (
    <SupabaseContext.Provider value={{ 
      supabase,
      isAuthenticated,
      session
    }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
