
import { NotificationBellIcon, PopoverNotificationCenter } from "@novu/react";
import { useNavigate } from "react-router-dom";

export function NovuNotificationBell() {
  const navigate = useNavigate();
  
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
      {({ unseenCount }) => (
        <NotificationBellIcon unseenCount={unseenCount} />
      )}
    </PopoverNotificationCenter>
  );
}
