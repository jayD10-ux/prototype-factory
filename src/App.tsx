
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { PrototypeDetail } from "@/components/PrototypeDetail";
import { ClerkAuthProvider, useClerkAuth } from "@/lib/clerk-provider";
import LoginPage from './components/login-page';
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
  // Add error fix hook
  fixSandpackPreviewError();
  return <>{children}</>;
};

const ProtectedRoute = ({ children, skipOnboardingCheck = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useClerkAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !skipOnboardingCheck && user) {
      // Check if user needs onboarding - we'll implement profile checks if needed
      const checkProfileCompletion = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();
          
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
    // Store the current path for redirect after login
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/sign-in" replace />;
  }

  if (needsOnboarding && !skipOnboardingCheck) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// We still need the supabase client for database operations
import { supabase } from "./integrations/supabase/client";

// Separate routes into its own component to fix the nesting issue
const AppRoutes = () => {
  const hasSkippedLogin = localStorage.getItem('skippedLogin') === 'true';
  const [initialized, setInitialized] = useState(false);
  const { isAuthenticated, isLoading, user } = useClerkAuth();
  
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

  // Create a mock session for SupabaseProvider from Clerk user
  const createSessionFromClerkUser = () => {
    if (!user) return null;
    
    return {
      user: {
        id: user.id,
        email: user.primaryEmail,
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: ""
      },
      access_token: "",
      refresh_token: "",
      expires_in: 3600
    };
  };

  return (
    <NavigationWrapper>
      <SupabaseProvider session={createSessionFromClerkUser()}>
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
          <ClerkAuthProvider>
            <AppRoutes />
          </ClerkAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
