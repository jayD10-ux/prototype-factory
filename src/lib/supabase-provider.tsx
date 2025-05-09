
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
  error: Error | null;
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
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("[SupabaseProvider] Mounted with initial session:", initialSession ? "exists" : "null");
    console.log("[SupabaseProvider] Initial user:", initialSession?.user ? "exists" : "null");
    
    try {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log("[SupabaseProvider] Auth state changed:", _event);
        setSession(newSession);
        setUser(newSession?.user || null);
      });
      
      return () => {
        console.log("[SupabaseProvider] Cleaning up subscription");
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error("[SupabaseProvider] Error initializing session:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      console.log("[SupabaseProvider] Finished initialization");
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [initialSession]);

  const value = {
    session,
    user,
    supabase,
    isAuthenticated: !!user,
    isLoading,
    isLoaded,
    error,
  };

  console.log("[SupabaseProvider] Rendering with values:", {
    isAuthenticated: !!user,
    isLoading, 
    isLoaded,
    hasError: !!error,
    userExists: !!user,
    sessionExists: !!session
  });

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
