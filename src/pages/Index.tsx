
import { PrototypeGrid } from "@/components/prototype-grid";
import { useSupabase } from "@/lib/supabase-provider";
import Dashboard from "@/components/dashboard";
import { useEffect } from "react";

const Index = () => {
  const { user, isLoading, isLoaded } = useSupabase();

  useEffect(() => {
    console.log("Index page mounted, auth state:", {
      authenticated: !!user,
      isLoading,
      isLoaded
    });
  }, [user, isLoading, isLoaded]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Dashboard />
    </main>
  );
};

export default Index;
