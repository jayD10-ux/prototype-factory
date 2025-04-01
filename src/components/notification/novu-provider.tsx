
import { NovuProvider } from "@novu/react";
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
      initialFetchingStrategy={{
        fetchNotifications: true,
        fetchUnseenCount: true,
      }}
      i18n="en"
      routerPush={(path) => navigate(path)}
      // Optional appearance customization
      appearance={{
        variables: {
          colorPrimary: "#DDD450",
          colorForeground: "#0E121B"
        }
      }}
    >
      {children}
    </NovuProvider>
  );
}
