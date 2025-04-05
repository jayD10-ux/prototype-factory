
import { ValidationTests } from "@/components/auth-validation/ValidationTests";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ValidationTestPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const fixRlsPolicies = async () => {
    setIsFixing(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-rls');
      
      if (error) {
        setErrorMessage(`Error: ${error.message}`);
        toast({
          variant: "destructive",
          title: "Error fixing RLS policies",
          description: error.message
        });
      } else {
        toast({
          title: "RLS policies fixed",
          description: "Refresh the page to run the tests again."
        });
      }
    } catch (err: any) {
      setErrorMessage(`Error: ${err.message}`);
      toast({
        variant: "destructive",
        title: "Error fixing RLS policies",
        description: err.message
      });
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={fixRlsPolicies} 
            disabled={isFixing}
          >
            {isFixing ? "Fixing RLS Policies..." : "Fix RLS Policies"}
          </Button>
        </div>
        
        {errorMessage && (
          <div className="bg-destructive/15 p-4 rounded-md text-sm">
            <p className="font-semibold mb-1">Error fixing RLS policies:</p>
            <p className="font-mono text-xs whitespace-pre-wrap">{errorMessage}</p>
          </div>
        )}
      </div>
      <ValidationTests />
    </div>
  );
}
