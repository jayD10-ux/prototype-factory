
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@/types/supabase';
import { useClerkAuth } from './clerk-provider';

interface SupabaseContextType {
  supabase: typeof supabase;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export interface SupabaseProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export function SupabaseProvider({ children, session: initialSession }: SupabaseProviderProps) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialSession?.user);
  const { isAuthenticated: isClerkAuthenticated, user: clerkUser } = useClerkAuth();

  // Update authentication state based on Clerk
  useEffect(() => {
    setIsAuthenticated(isClerkAuthenticated);
    
    // If Clerk user changes and is authenticated, update Supabase user info
    if (isClerkAuthenticated && clerkUser && user?.id !== clerkUser.id) {
      setUser({
        ...user,
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        app_metadata: {
          provider: 'clerk'
        },
        user_metadata: {
          name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : undefined,
          avatar_url: clerkUser.imageUrl || undefined
        },
        aud: "authenticated",
        created_at: clerkUser.createdAt ? clerkUser.createdAt.toString() : new Date().toISOString()
      });
    }
  }, [isClerkAuthenticated, clerkUser, user]);

  // Simple function to refresh session if needed
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      // With Clerk as our auth provider, we don't need to refresh Supabase auth
      // Just pass through the authentication state
      setIsAuthenticated(isClerkAuthenticated);
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the client to children
  const value = {
    session,
    user,
    supabase,
    isLoading,
    isAuthenticated, // Use updated state that reflects Clerk's auth state
    refreshSession,
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
