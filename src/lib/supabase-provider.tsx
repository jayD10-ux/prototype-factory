
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseContextType {
  supabase: typeof supabase;
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoaded: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export interface SupabaseProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export function SupabaseProvider({ children, session: initialSession }: SupabaseProviderProps) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSession(initialSession);
    setUser(initialSession?.user || null);
    setIsLoading(false);
    setIsLoaded(true);
  }, [initialSession]);

  const value = {
    session,
    user,
    supabase,
    isAuthenticated: !!user,
    isLoading,
    isLoaded,
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
