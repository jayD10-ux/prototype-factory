
import { PrototypeGrid } from "@/components/prototype-grid";
import { useClerkAuth } from "@/lib/clerk-provider";
import Dashboard from "@/components/dashboard";

const Index = () => {
  const { isLoading } = useClerkAuth();

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
