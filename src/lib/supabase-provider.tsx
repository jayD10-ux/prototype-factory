
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
    console.log("[SupabaseProvider] Initializing with session:", initialSession ? "exists" : "null");
    
    // Call to reset RLS policies
    const fixRLS = async () => {
      try {
        console.log("[SupabaseProvider] Attempting to fix RLS policies...");
        const { data, error } = await supabase.functions.invoke('fix-rls');
        
        if (error) {
          console.error("[SupabaseProvider] Error calling fix-rls:", error);
        } else {
          console.log("[SupabaseProvider] RLS fix result:", data);
        }
      } catch (err) {
        console.error("[SupabaseProvider] Error invoking fix-rls function:", err);
      }
    };
    
    // Only call fixRLS after a short delay to ensure auth is initialized
    const timer = setTimeout(() => {
      fixRLS();
    }, 2000);
    
    try {
      console.log("[SupabaseProvider] Setting initial session and user");
      setSession(initialSession);
      setUser(initialSession?.user || null);
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        console.log("[SupabaseProvider] Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user || null);
      });
      
      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error("[SupabaseProvider] Error initializing auth:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
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
