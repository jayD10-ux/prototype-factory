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
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrototype = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('prototypes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setPrototype(data);
      } catch (error) {
        console.error("Error fetching prototype:", error);
        toast({
          title: "Error",
          description: "Failed to load prototype.",
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
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!prototype) {
    return <div>Prototype not found.</div>;
  }

  return (
    <div>
      <h1>{prototype.name}</h1>
      <p>{prototype.description}</p>
      <Button onClick={() => window.open(prototype.url, "_blank")}>
        View Prototype
      </Button>
    </div>
  );
}
