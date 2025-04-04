
import { FC, ReactNode, useEffect } from "react";
import { NovuProvider as ExternalNovuProvider } from "@novu/react";
import { useClerkAuth } from "@/lib/clerk-provider";
import { useSupabase } from "@/lib/supabase-provider";

interface NovuProviderProps {
  children: ReactNode;
}

export const NovuProvider: FC<NovuProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useClerkAuth();
  
  // No longer need session from Supabase since we're using Clerk
  const { supabase } = useSupabase();
  
  // If Novu is configured with an application ID, use it, otherwise default to empty string
  const NOVU_APP_ID = import.meta.env.VITE_NOVU_APP_ID || "";
  
  useEffect(() => {
    // Log initialization instead of using onInit prop
    console.log("Novu provider initialized");
  }, []);
  
  // Important fix: Use an anonymous-user ID that will never match a real user
  // This prevents issues with the Novu subscriber data when not authenticated
  const subscriberId = isAuthenticated && user ? user.id : "anonymous-user-" + Math.random().toString(36).substring(2, 15);
  
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
