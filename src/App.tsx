
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
import ValidationTest from "./pages/ValidationTest";
import Auth from "./pages/Auth";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Create a client for React Query
const queryClient = createQueryClient();

function App() {
  useEffect(() => {
    const fixRLS = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fix-rls', {
          method: 'POST',
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
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <NovuProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/prototype/:id" element={<PrototypeDetail />} />
                <Route path="/p/:id" element={<SharedPrototype />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/validation" element={<ValidationTest />} />
                <Route path="/auth" element={<Auth />} />
              </Routes>
            </Router>
            <Toaster />
          </NovuProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
