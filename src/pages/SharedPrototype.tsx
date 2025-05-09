
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SharedPrototype() {
  const { id } = useParams<{ id: string }>();
  const [prototype, setPrototype] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrototype = async () => {
      if (!id) {
        setError("No prototype ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("[SharedPrototype] Fetching prototype:", id);
        setLoading(true);
        
        // First try to fix RLS policies to ensure access works correctly
        try {
          console.log("[SharedPrototype] Calling fix-rls function");
          await supabase.functions.invoke('fix-rls');
          console.log("[SharedPrototype] RLS policies updated");
        } catch (rlsError) {
          console.error("[SharedPrototype] Error fixing RLS (continuing anyway):", rlsError);
        }
        
        // Fetch the prototype with error handling
        const { data, error: fetchError } = await supabase
          .from('prototypes')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          console.error("[SharedPrototype] Database fetch error:", fetchError);
          throw fetchError;
        }

        if (!data) {
          console.error("[SharedPrototype] No prototype found with ID:", id);
          setError("Prototype not found");
        } else {
          console.log("[SharedPrototype] Prototype data retrieved:", data);
          setPrototype(data);
        }
      } catch (err: any) {
        const errorMessage = err?.message || "An unknown error occurred";
        console.error("[SharedPrototype] Error:", errorMessage);
        
        setError(`Failed to load prototype: ${errorMessage}`);
        
        toast({
          title: "Error",
          description: `Failed to load prototype: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrototype();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 mr-2" />
        <span>Loading prototype...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h2 className="text-xl font-bold text-destructive">Error</h2>
        <p>{error}</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!prototype) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h2 className="text-xl font-bold">Prototype Not Found</h2>
        <p>The prototype you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{prototype.name}</h1>
      {prototype.description && <p className="mb-6">{prototype.description}</p>}
      
      {prototype.url ? (
        <Button 
          onClick={() => window.open(prototype.url, "_blank")}
          className="mb-4"
        >
          View Prototype
        </Button>
      ) : (
        <p className="text-muted-foreground">This prototype is still being processed...</p>
      )}
      
      <Button variant="outline" onClick={() => window.history.back()} className="mt-4">
        Go Back
      </Button>
    </div>
  );
}
