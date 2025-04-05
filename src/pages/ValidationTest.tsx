
import { ValidationTests } from "@/components/auth-validation/ValidationTests";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

export default function ValidationTestPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { toast } = useToast();

  const fixRlsPolicies = async () => {
    setIsFixing(true);
    setErrorMessage(null);
    setErrorDetails(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-rls');
      
      if (error) {
        setErrorMessage(`Error: ${error.message}`);
        setErrorDetails(error.stack || JSON.stringify(error, null, 2));
        toast({
          variant: "destructive",
          title: "Error fixing RLS policies",
          description: error.message
        });
      } else if (data && !data.success) {
        // Handle case where function returns 200 but with an error in data
        setErrorMessage(`Error: ${data.error || 'Unknown error'}`);
        setErrorDetails(data.stack || JSON.stringify(data, null, 2));
        toast({
          variant: "destructive",
          title: "Error fixing RLS policies",
          description: data.error || 'Unknown error'
        });
      } else {
        toast({
          title: "RLS policies fixed",
          description: "Refresh the page to run the tests again."
        });
      }
    } catch (err: any) {
      console.error("Error fixing RLS policies:", err);
      setErrorMessage(`Error: ${err.message || 'Unknown error'}`);
      setErrorDetails(err.stack || JSON.stringify(err, null, 2));
      toast({
        variant: "destructive",
        title: "Error fixing RLS policies",
        description: err.message || 'Unknown error'
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
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertCircle className="h-4 w-4" />
              <p>Error fixing RLS policies:</p>
            </div>
            <p className="font-mono text-xs whitespace-pre-wrap mb-2">{errorMessage}</p>
            {errorDetails && (
              <>
                <p className="font-semibold mt-2 mb-1">Details:</p>
                <pre className="bg-black/10 p-2 rounded text-xs overflow-x-auto">
                  {errorDetails}
                </pre>
              </>
            )}
          </div>
        )}
      </div>
      <ValidationTests />
    </div>
  );
}
