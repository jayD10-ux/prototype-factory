
import { FC, ReactNode, useEffect, useMemo } from "react";
import { NovuProvider as ExternalNovuProvider } from "@novu/react";
import { useClerkAuth } from "@/lib/clerk-provider";
import { useSupabase } from "@/lib/supabase-provider";

interface NovuProviderProps {
  children: ReactNode;
}

export const NovuProvider: FC<NovuProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoaded } = useClerkAuth();
  
  // No longer need session from Supabase since we're using Clerk
  const { supabase } = useSupabase();
  
  // If Novu is configured with an application ID, use it, otherwise default to empty string
  const NOVU_APP_ID = import.meta.env.VITE_NOVU_APP_ID || "";
  
  // Generate a stable anonymous ID that persists across renders but changes between sessions
  // This prevents issues with the Novu subscriber data when not authenticated
  const anonymousId = useMemo(() => {
    // Try to use a stored ID first
    const storedId = sessionStorage.getItem('anonymous-novu-id');
    if (storedId) return storedId;
    
    // Generate a new one if not found
    const newId = "anonymous-user-" + Math.random().toString(36).substring(2, 15);
    try {
      sessionStorage.setItem('anonymous-novu-id', newId);
    } catch (e) {
      console.error("Failed to store anonymous ID:", e);
    }
    return newId;
  }, []);
  
  useEffect(() => {
    // Log initialization instead of using onInit prop
    console.log("Novu provider initialized with", isAuthenticated ? "authenticated user" : "anonymous user");
  }, [isAuthenticated]);
  
  // Make sure we have a valid subscriber ID - either a real user or a consistent anonymous ID
  const subscriberId = isAuthenticated && user ? user.id : anonymousId;
  
  // Don't attempt to initialize Novu until Clerk has loaded
  if (!isLoaded) {
    return <>{children}</>; // Simply render children without Novu until auth is ready
  }
  
  // Always wrap in NovuProvider, even for anonymous users, to avoid rendering errors
  // This ensures the notification context is always available
  return (
    <ExternalNovuProvider
      applicationIdentifier={NOVU_APP_ID}
      subscriberId={subscriberId}
      // Only provide subscriber hash if authenticated
      subscriberHash=""
    >
      {children}
    </ExternalNovuProvider>
  );
};
