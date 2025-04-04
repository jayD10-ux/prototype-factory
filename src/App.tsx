
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PrototypeDetail } from "@/components/PrototypeDetail";
import { useClerkAuth } from "./lib/clerk-provider";
import { EnvironmentBadge } from "./components/environment-badge";
import Onboarding from "./pages/Onboarding";
import { NovuNotificationProvider } from "./components/notification/novu-provider";
import SharedPrototype from './pages/SharedPrototype';
import { SignIn, SignUp } from "@clerk/clerk-react";
import { fixSandpackPreviewError } from "./components/SandpackPreview";
import { SupabaseProvider } from "./lib/supabase-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

const NavigationWrapper = ({ children }: { children: React.ReactNode }) => {
  fixSandpackPreviewError();
  return <>{children}</>;
};

const ProtectedRoute = ({ children, skipOnboardingCheck = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useClerkAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !skipOnboardingCheck && user) {
      const checkProfileCompletion = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('name')
            .eq('clerk_id', user.id)
            .maybeSingle();
          
          setNeedsOnboarding(!data?.name);
        } catch (error) {
          console.error('Error checking profile:', error);
          setNeedsOnboarding(true);
        }
      };
      
      checkProfileCompletion();
    }
  }, [isLoading, user, skipOnboardingCheck]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-sm text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/sign-in" replace />;
  }

  if (needsOnboarding && !skipOnboardingCheck) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useClerkAuth();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    setInitialized(true);
  }, []);
  
  if (!initialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-sm text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <NavigationWrapper>
      <SupabaseProvider>
        <Routes>
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute skipOnboardingCheck={true}>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/sign-in" />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <NovuNotificationProvider>
                  <Index />
                </NovuNotificationProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prototype/:id"
            element={
              <ProtectedRoute>
                <NovuNotificationProvider>
                  <PrototypeDetail />
                </NovuNotificationProvider>
              </ProtectedRoute>
            }
          />
          <Route path="/p/:id" element={<SharedPrototype />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SupabaseProvider>
      <Toaster />
      <Sonner />
      <EnvironmentBadge />
    </NavigationWrapper>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
