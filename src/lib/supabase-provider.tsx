
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@/types/supabase';

interface SupabaseContextType {
  supabase: typeof supabase;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
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
  const navigate = useNavigate();

  // Initialize session state
  useEffect(() => {
    setSession(initialSession);
    setUser(initialSession?.user || null);
    setIsLoading(false);
  }, [initialSession]);

  // Set up auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state change event:', event, !!newSession);
      
      // Update the session and user state
      setSession(newSession);
      setUser(newSession?.user || null);
      
      // Only redirect to auth if explicitly signed out
      // This prevents unwanted redirects when session is just being refreshed
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    // Get current session to initialize state correctly
    const refreshSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
        setIsLoading(false);
      } catch (error) {
        console.error('Error refreshing session:', error);
        setIsLoading(false);
      }
    };
    
    refreshSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Provide the session and client to children
  const value = {
    session,
    user,
    supabase,
    isLoading,
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
