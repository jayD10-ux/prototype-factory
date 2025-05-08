
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
import { useEffect, useState } from "react";
import type { Session } from '@supabase/auth-js';
import { supabase } from "@/integrations/supabase/client";

// Create a client for React Query
const queryClient = createQueryClient();

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fix RLS when session is available
  useEffect(() => {
    const fixRLS = async () => {
      if (!session?.access_token) return;

      try {
        const { data, error } = await supabase.functions.invoke('fix-rls', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (error) {
          console.error("Error fixing RLS:", error);
        } else {
          console.log("RLS fixed successfully:", data);
        }
      } catch (err) {
        console.error("Error calling fix-rls function:", err);
      }
    };

    fixRLS();
  }, [session]);

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
