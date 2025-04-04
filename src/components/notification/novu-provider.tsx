
// Update the Novu provider to use Clerk authentication
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

  if (!isAuthenticated || isLoading || !user) {
    return <>{children}</>;
  }

  return (
    <ExternalNovuProvider
      applicationIdentifier={NOVU_APP_ID}
      subscriberId={user.id}
      subscriberHash=""
    >
      {children}
    </ExternalNovuProvider>
  );
};
