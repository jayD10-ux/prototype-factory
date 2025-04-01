
import { NovuProvider } from "@novu/notification-center";
import { useSupabase } from "@/lib/supabase-provider";
import { useNavigate } from "react-router-dom";
import React from "react";

interface NovuNotificationProviderProps {
  children: React.ReactNode;
}

export function NovuNotificationProvider({ children }: NovuNotificationProviderProps) {
  const { session } = useSupabase();
  const navigate = useNavigate();
  
  // Application identifier from your Novu dashboard
  const applicationIdentifier = "pGu4iA9YYPiQ"; // This is from your supabase/functions/send-notification/index.ts
  
  // Only provide Novu context if the user is logged in
  if (!session?.user?.id) {
    return <>{children}</>;
  }
  
  return (
    <NovuProvider
      applicationIdentifier={applicationIdentifier}
      subscriberId={session.user.id}
      backendUrl="https://api.novu.co"
      socketUrl="https://ws.novu.co"
      i18n="en"
      onLoad={() => {
        console.log("Novu loaded successfully");
      }}
      subscriberHash={undefined} // Add a hash if your backend provides one for security
      styles={{
        variables: {
          main: "#DDD450",
          light: "#0E121B"
        }
      }}
    >
      {children}
    </NovuProvider>
  );
}
