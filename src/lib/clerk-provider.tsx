
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { User } from '@/types/supabase';

interface ClerkContextType {
  user: {
    id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoaded: boolean;
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

  // Convert Clerk user to a format compatible with our existing app
  useEffect(() => {
    if (isClerkLoaded && isUserLoaded) {
      try {
        if (clerkUser && userId) {
          // Create a user object that matches the structure expected by the app
          setUser({
            id: userId, 
            email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.firstName || '',
            avatar_url: clerkUser.imageUrl || undefined,
            created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString()
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error setting user data:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [clerkUser, userId, isClerkLoaded, isUserLoaded]);

  // Provide the auth state to children
  const value = {
    user,
    isLoading,
    isAuthenticated: !!userId && !!isSignedIn,
    isLoaded: isClerkLoaded && isUserLoaded,
  };

  // Return placeholder during initial load to prevent rendering errors
  if (!isClerkLoaded || !isUserLoaded) {
    return (
      <ClerkContext.Provider 
        value={{
          user: null,
          isLoading: true,
          isAuthenticated: false,
          isLoaded: false
        }}
      >
        {children}
      </ClerkContext.Provider>
    );
  }

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
