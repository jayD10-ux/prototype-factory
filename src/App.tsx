
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { SupabaseProvider } from "@/lib/supabase-provider";
import { NovuProvider } from "@/components/notification/novu-provider";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/ui/theme-provider";
import Index from "./pages/Index";
import SharedPrototype from "./pages/SharedPrototype";
import { PrototypeDetail } from "./components/PrototypeDetail";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import type { Session } from '@supabase/auth-js';
import { supabase } from "@/integrations/supabase/client";

// Create a client for React Query
const queryClient = createQueryClient();

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    console.log("App component mounted");
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session retrieved:", session ? "session exists" : "no session");
      setSession(session);
      setInitialized(true);
    }).catch(error => {
      console.error("Error retrieving session:", error);
      setInitialized(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event);
      setSession(session);
    });

    return () => {
      console.log("App component unmounting, cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  if (!initialized) {
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
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <Router>
          <SupabaseProvider session={session}>
            <NovuProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/prototype/:id" element={<PrototypeDetail />} />
                <Route path="/p/:id" element={<SharedPrototype />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </NovuProvider>
          </SupabaseProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
