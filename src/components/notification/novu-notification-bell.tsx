
import { NotificationBell, PopoverNotificationCenter } from "@novu/notification-center";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/lib/clerk-provider";

export function NovuNotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated } = useClerkAuth();
  
  // If not authenticated, show an empty notification bell
  if (!isAuthenticated) {
    return <NotificationBell unseenCount={0} />;
  }
  
  return (
    <PopoverNotificationCenter 
      colorScheme="light"
      onNotificationClick={(notification) => {
        // Handle notification click - navigate or perform actions
        if (notification.cta?.data?.url) {
          navigate(notification.cta.data.url);
        }
        return false; // Don't trigger the default behavior
      }}
    >
      {(props) => {
        // Safely handle the case where props might be null
        const unseenCount = props?.unseenCount || 0;
        return <NotificationBell unseenCount={unseenCount} />;
      }}
    </PopoverNotificationCenter>
  );
}
