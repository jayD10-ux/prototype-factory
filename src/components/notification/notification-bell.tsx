
import { NovuNotificationBell } from "./novu-notification-bell";
import { useClerkAuth } from "@/lib/clerk-provider";
import { Suspense, ErrorBoundary } from "react";

// Simple error boundary component
class NotificationErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("NotificationErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function NotificationBell() {
  const { isAuthenticated, isLoaded } = useClerkAuth();
  
  // Don't render anything until authentication is loaded
  if (!isLoaded) {
    return null;
  }
  
  // Wrap in error boundary to prevent crashes
  return (
    <NotificationErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <NovuNotificationBell />
      </Suspense>
    </NotificationErrorBoundary>
  );
}
