
import { NotificationBell, PopoverNotificationCenter } from "@novu/notification-center";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/lib/clerk-provider";
import { useState, useEffect } from "react";

export function NovuNotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated } = useClerkAuth();
  const [error, setError] = useState<Error | null>(null);
  
  // Handle potential Novu errors at the component level
  useEffect(() => {
    // Setup a global error handler for Novu-related errors
    const handleError = (event: ErrorEvent) => {
      // Only capture errors that seem related to notifications
      if (event.message.includes('notification') || event.message.includes('Novu') || 
          event.message.includes('unseenCount')) {
        console.error("Notification system error:", event.error);
        setError(event.error || new Error(event.message));
        // Prevent default error handling
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // If not authenticated, show an empty notification bell
  if (!isAuthenticated) {
    return <NotificationBell unseenCount={0} />;
  }
  
  // Handle error state
  if (error) {
    console.error("Notification error:", error);
    return <NotificationBell unseenCount={0} />;
  }
  
  // We wrap the actual component in a try-catch to handle any rendering errors
  try {
    return (
      <PopoverNotificationCenter 
        colorScheme="light"
        onNotificationClick={(notification) => {
          try {
            // Handle notification click - navigate or perform actions
            if (notification?.cta?.data?.url) {
              navigate(notification.cta.data.url);
            }
          } catch (err) {
            console.error("Error handling notification click:", err);
          }
          return false; // Don't trigger the default behavior
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
  } catch (error) {
    console.error("Error rendering notification center:", error);
    setError(error as Error);
    return <NotificationBell unseenCount={0} />;
  }
}
