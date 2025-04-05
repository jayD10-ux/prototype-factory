
import { ValidationTests } from "@/components/auth-validation/ValidationTests";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ValidationTestPage() {
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const fixRlsPolicies = async () => {
    setIsFixing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-rls');
      
      if (error) {
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
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={fixRlsPolicies} 
          disabled={isFixing}
        >
          {isFixing ? "Fixing RLS Policies..." : "Fix RLS Policies"}
        </Button>
      </div>
      <ValidationTests />
    </div>
  );
}
