
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { User } from '@/types/supabase';

interface ClerkContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const ClerkContext = createContext<ClerkContextType | undefined>(undefined);

export interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkAuthProvider({ children }: ClerkProviderProps) {
  const { isLoaded: isClerkLoaded, userId, isSignedIn } = useAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
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
            name: clerkUser.fullName || undefined,
            avatar_url: clerkUser.imageUrl || undefined
          },
          aud: 'authenticated',
          created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString()
        };

        setUser(adaptedUser);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    }
  }, [clerkUser, userId, isClerkLoaded, isUserLoaded]);

  const isAuthenticated = !!userId && isSignedIn;

  // Provide the auth state to children
  const value = {
    user,
    isLoading,
    isAuthenticated,
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
