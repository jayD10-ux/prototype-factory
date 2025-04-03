
import { NovuProvider } from "@novu/notification-center";
import { useSupabase } from "@/lib/supabase-provider";
import { useNavigate } from "react-router-dom";
import React from "react";
import { useClerkAuth } from "@/lib/clerk-provider";

interface NovuNotificationProviderProps {
  children: React.ReactNode;
}

export function NovuNotificationProvider({ children }: NovuNotificationProviderProps) {
  const { session } = useSupabase();
  const { user: clerkUser } = useClerkAuth();
  const navigate = useNavigate();
  
  // Application identifier from your Novu dashboard
  const applicationIdentifier = "pGu4iA9YYPiQ"; // This is from your supabase/functions/send-notification/index.ts
  
  // Get user ID from either Supabase session or Clerk
  const userId = session?.user?.id || clerkUser?.id;
  
  // Only provide Novu context if the user is logged in
  if (!userId) {
    return <>{children}</>;
  }
  
  return (
    <NovuProvider
      applicationIdentifier={applicationIdentifier}
      subscriberId={userId}
      backendUrl="https://api.novu.co"
      socketUrl="https://ws.novu.co"
      i18n="en"
      onLoad={() => {
        console.log("Novu loaded successfully");
      }}
      subscriberHash={undefined} // Add a hash if your backend provides one for security
    >
      {children}
    </NovuProvider>
  );
}
