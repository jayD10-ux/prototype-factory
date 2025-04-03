import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { PrototypeDetail } from "@/components/PrototypeDetail";
import { SupabaseProvider } from "@/lib/supabase-provider";
import type { User } from '@/types/supabase';
import LoginPage from './components/login-page';
import { EnvironmentBadge } from "./components/environment-badge";
import Onboarding from "./pages/Onboarding";
import { NovuNotificationProvider } from "./components/notification/novu-provider";
import SharedPrototype from './pages/SharedPrototype';

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
  return <>{children}</>;
};

const ProtectedRoute = ({ children, skipOnboardingCheck = false }: ProtectedRouteProps) => {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        
        if (data.session?.user && !skipOnboardingCheck) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.session.user.id)
            .single();
            
          setNeedsOnboarding(!profileData?.name);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (!session) {
        setLoading(false);
      } else if (!skipOnboardingCheck) {
        const checkProfile = async () => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', session.user.id)
              .single();
              
            setNeedsOnboarding(!profileData?.name);
            setLoading(false);
          } catch (error) {
            console.error('Error checking profile:', error);
            setLoading(false);
          }
        };
        
        checkProfile();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [skipOnboardingCheck, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-sm text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (needsOnboarding && !skipOnboardingCheck) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <SupabaseProvider session={session}>
      {children}
    </SupabaseProvider>
  );
};

const AppContent = () => {
  const hasSkippedLogin = localStorage.getItem('skippedLogin') === 'true';

  return (
    <BrowserRouter>
      <NavigationWrapper>
        <Routes>
          <Route path="/auth" element={<Auth />} />
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
            element={hasSkippedLogin ? <Navigate to="/dashboard" /> : <LoginPage />}
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
        <Toaster />
        <Sonner />
        <EnvironmentBadge />
      </NavigationWrapper>
    </BrowserRouter>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
