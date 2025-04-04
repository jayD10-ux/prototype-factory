
import { NovuNotificationBell } from "./novu-notification-bell";
import { useClerkAuth } from "@/lib/clerk-provider";

export function NotificationBell() {
  const { isAuthenticated, isLoaded } = useClerkAuth();
  
  // Don't render anything until authentication is loaded
  if (!isLoaded) {
    return null;
  }
  
  return <NovuNotificationBell />;
}
