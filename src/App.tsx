
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { PrototypeDetail } from "@/components/PrototypeDetail";
import SharedPrototype from "@/pages/SharedPrototype";
import NotFound from "@/pages/NotFound";
import { ThemeProvider } from "./components/ui/theme-provider";
import { ClerkAuthProvider } from "./lib/clerk-provider";
import { SupabaseProvider } from "./lib/supabase-provider";
import { SignIn, SignUp, ClerkProvider } from "@clerk/clerk-react";
import { NovuProvider } from "./components/notification/novu-provider";
import Onboarding from "./pages/Onboarding";

// Import this for compatibility with existing code
// This will be phased out as we migrate to useSupabase hook
import { supabase } from "./integrations/supabase/client";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: import.meta.env.PROD, // Only refetch on window focus in production
      retry: 1, // Only retry failed queries once
    },
  },
});

export default function App() {
  // Log environment variables on startup for debugging
  useEffect(() => {
    const environment = import.meta.env.VITE_ENVIRONMENT || "development";
    console.log(`Running in ${environment} environment`);
  }, []);

  return (
    <ClerkProvider>
      <ThemeProvider defaultTheme="light" storageKey="theme">
        <ClerkAuthProvider>
          <SupabaseProvider>
            <QueryClientProvider client={queryClient}>
              <NovuProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
                    <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/prototype/:id" element={<PrototypeDetail />} />
                    <Route path="/share/:id/:shareId" element={<SharedPrototype />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Router>
              </NovuProvider>
              <Toaster />
            </QueryClientProvider>
          </SupabaseProvider>
        </ClerkAuthProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
