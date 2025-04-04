
import { NovuNotificationBell } from "./novu-notification-bell";
import { useClerkAuth } from "@/lib/clerk-provider";
import { Suspense } from "react";

export function NotificationBell() {
  const { isAuthenticated, isLoaded } = useClerkAuth();
  
  // Don't render anything until authentication is loaded
  if (!isLoaded) {
    return null;
  }
  
  // Wrap in error boundary to prevent crashes
  return (
    <Suspense fallback={null}>
      <NovuNotificationBell />
    </Suspense>
  );
}
