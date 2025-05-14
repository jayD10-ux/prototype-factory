
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { PreviewWindow } from "@/components/PreviewWindow";

export default function SharedPrototype() {
  const { id } = useParams<{ id: string }>();
  const [prototype, setPrototype] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
        
        // Fetch the prototype with error handling
        const { data, error: fetchError } = await supabase
          .from('prototypes')
          .select('*, profiles:created_by(*)')
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
    <div className="fixed inset-0 flex flex-col">
      {/* Header */}
      <div className="bg-background p-3 flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.history.back()}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex-1">
          <h1 className="text-lg font-medium">{prototype.name}</h1>
          {prototype.profiles && (
            <p className="text-xs text-muted-foreground">
              Created by {prototype.profiles.name || 'Unknown'}
            </p>
          )}
        </div>
        
        {prototype.url && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(prototype.url, "_blank")}
            className="ml-auto flex items-center gap-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>External Link</span>
          </Button>
        )}
      </div>

      {/* Prototype Preview */}
      <div className="flex-1 overflow-hidden">
        <PreviewWindow 
          prototypeId={id || ''} 
          url={prototype.deployment_url || prototype.url} 
        />
      </div>
    </div>
  );
}
