
import { NotificationBell, PopoverNotificationCenter } from "@novu/notification-center";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/lib/clerk-provider";
import { useState } from "react";

export function NovuNotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated } = useClerkAuth();
  const [error, setError] = useState<Error | null>(null);
  
  // If not authenticated, show an empty notification bell
  if (!isAuthenticated) {
    return <NotificationBell unseenCount={0} />;
  }
  
  // Handle error state
  if (error) {
    console.error("Notification error:", error);
    return <NotificationBell unseenCount={0} />;
  }
  
  return (
    <PopoverNotificationCenter 
      colorScheme="light"
      onNotificationClick={(notification) => {
        // Handle notification click - navigate or perform actions
        if (notification?.cta?.data?.url) {
          navigate(notification.cta.data.url);
        }
        return false; // Don't trigger the default behavior
      }}
      onError={(error) => {
        console.error("Novu notification error:", error);
        setError(error);
      }}
    >
      {(props) => {
        try {
          // Extra safety check - if props is null or undefined, use 0 for unseenCount
          if (!props) {
            return <NotificationBell unseenCount={0} />;
          }
          // Safely handle the case where props.unseenCount might be undefined
          const unseenCount = typeof props.unseenCount === 'number' ? props.unseenCount : 0;
          return <NotificationBell unseenCount={unseenCount} />;
        } catch (err) {
          console.error("Error rendering notification bell:", err);
          return <NotificationBell unseenCount={0} />;
        }
      }}
    </PopoverNotificationCenter>
  );
}
