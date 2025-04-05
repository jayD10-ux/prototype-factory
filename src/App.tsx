
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { SupabaseProvider } from "@/lib/supabase-provider";
import { ClerkAuthProvider } from "@/lib/clerk-provider";
import { NovuProvider } from "@/components/notification/novu-provider";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/ui/theme-provider";
import Index from "./pages/Index";
import SharedPrototype from "./pages/SharedPrototype";
import { PrototypeDetail } from "./components/PrototypeDetail";
import Onboarding from "./pages/Onboarding";
import ValidationTest from "./pages/ValidationTest";

// Create a client for React Query
const queryClient = createQueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <ClerkAuthProvider>
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
                </Routes>
              </Router>
              <Toaster />
            </NovuProvider>
          </SupabaseProvider>
        </ClerkAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
