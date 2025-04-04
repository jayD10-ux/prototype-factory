
import { NotificationBell, PopoverNotificationCenter } from "@novu/notification-center";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/lib/clerk-provider";
import { useState, useEffect } from "react";

export function NovuNotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoaded } = useClerkAuth();
  const [error, setError] = useState<Error | null>(null);
  
  // Don't render anything until auth is loaded
  if (!isLoaded) {
    return null;
  }
  
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
      <ErrorBoundaryWrapper fallback={<NotificationBell unseenCount={0} />}>
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
          {/* Safe rendering with proper fallbacks */}
          {(renderProps) => {
            try {
              // If renderProps is null/undefined, return a default bell
              if (!renderProps) {
                console.log("Novu renderProps is null, using default bell");
                return <NotificationBell unseenCount={0} />;
              }
              
              // Extract unseenCount safely with proper fallback
              const unseenCount = 
                typeof renderProps === 'object' && 
                renderProps !== null && 
                'unseenCount' in renderProps && 
                typeof renderProps.unseenCount === 'number' 
                  ? renderProps.unseenCount 
                  : 0;
              
              return <NotificationBell unseenCount={unseenCount} />;
            } catch (err) {
              console.error("Error rendering notification bell:", err);
              // Return a safe fallback
              return <NotificationBell unseenCount={0} />;
            }
          }}
        </PopoverNotificationCenter>
      </ErrorBoundaryWrapper>
    );
  } catch (error) {
    console.error("Error rendering notification center:", error);
    setError(error as Error);
    return <NotificationBell unseenCount={0} />;
  }
}

// Simple error boundary component to catch and handle errors
function ErrorBoundaryWrapper({ 
  children, 
  fallback = <div>Error loading component</div> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Setup error handler
    const errorHandler = (event: ErrorEvent) => {
      // Only capture Novu-related errors
      if (event.message.includes('notification') || 
          event.message.includes('Novu') || 
          event.message.includes('unseenCount') ||
          event.message.includes('PopoverNotificationCenter')) {
        console.error('Captured notification error:', event.error);
        setHasError(true);
        event.preventDefault(); // Prevent default handling
      }
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);
  
  if (hasError) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
