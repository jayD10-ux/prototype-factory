
'use client';

import { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, useUser } from '@clerk/clerk-react';

interface SupabaseContextType {
  supabase: typeof supabase;
  isAuthenticated: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const { isSignedIn } = useAuth();
  
  // Provide the client to children without any auth-related state
  const value = {
    supabase,
    isAuthenticated: !!isSignedIn,
  };

  return (
    <SupabaseContext.Provider value={value}>
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
