
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { User } from '@/types/supabase';

// Creating a type that mimics Supabase session structure for compatibility
interface ClerkSession {
  user: User | null;
  expires_at?: number;
}

interface ClerkContextType {
  session: ClerkSession | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const ClerkContext = createContext<ClerkContextType | undefined>(undefined);

export interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkAuthProvider({ children }: ClerkProviderProps) {
  const { isLoaded: isClerkLoaded, userId, sessionId } = useAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const [session, setSession] = useState<ClerkSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Convert Clerk user to a format compatible with our existing app
  useEffect(() => {
    if (isClerkLoaded && isUserLoaded) {
      if (clerkUser && userId) {
        // Create a user object that matches the structure expected by the app
        const adaptedUser: User = {
          id: userId,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          app_metadata: {
            provider: 'clerk'
          },
          user_metadata: {
            name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : undefined,
            avatar_url: clerkUser.imageUrl || undefined
          },
          aud: 'authenticated',
          created_at: clerkUser.createdAt ? clerkUser.createdAt.toString() : new Date().toISOString()
        };

        // Create a session object that mimics Supabase session
        const adaptedSession: ClerkSession = {
          user: adaptedUser,
          expires_at: Math.floor(Date.now() / 1000) + 3600 // Mock 1 hour expiry
        };

        setUser(adaptedUser);
        setSession(adaptedSession);
      } else {
        setUser(null);
        setSession(null);
      }
      
      setIsLoading(false);
    }
  }, [clerkUser, userId, isClerkLoaded, isUserLoaded]);

  // Function to manually refresh the session
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      // With Clerk, we don't need to manually refresh usually
      // This is just for API compatibility with the existing code
      if (clerkUser && userId) {
        const adaptedUser: User = {
          id: userId,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          app_metadata: {
            provider: 'clerk'
          },
          user_metadata: {
            name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : undefined,
            avatar_url: clerkUser.imageUrl || undefined
          },
          aud: 'authenticated',
          created_at: clerkUser.createdAt ? clerkUser.createdAt.toString() : new Date().toISOString()
        };

        const adaptedSession: ClerkSession = {
          user: adaptedUser,
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };

        setUser(adaptedUser);
        setSession(adaptedSession);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!userId && !!sessionId;

  // Provide the session and auth state to children
  const value = {
    session,
    user,
    isLoading,
    isAuthenticated,
    refreshSession,
  };

  return (
    <ClerkContext.Provider value={value}>
      {children}
    </ClerkContext.Provider>
  );
}

export function useClerkAuth() {
  const context = useContext(ClerkContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
}
