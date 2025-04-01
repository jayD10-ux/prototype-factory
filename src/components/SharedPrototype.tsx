
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PreviewWindow } from "./PreviewWindow";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, AlertTriangle, User, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PrototypeShare } from "@/types/prototype-sharing";

export const SharedPrototype = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [processingTimeout, setProcessingTimeout] = useState(false);
  
  const { 
    data: prototype, 
    isLoading, 
    refetch,
    isRefetching,
    error
  } = useQuery({
    queryKey: ['shared-prototype', id],
    queryFn: async () => {
      try {
        // First, check if the prototype is publicly shared
        const { data: shareData, error: shareError } = await supabase
          .from('prototype_shares' as any)
          .select('*')
          .eq('prototype_id', id)
          .or(`is_public.eq.true`);
        
        if (shareError) {
          throw shareError;
        }
        
        // If no share found, the prototype is not publicly accessible
        const typedShareData = shareData as unknown as PrototypeShare[];
        if (!typedShareData || typedShareData.length === 0) {
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "This prototype is not publicly shared"
          });
          throw new Error("Access denied");
        }
        
        // Update access timestamp
        if (typedShareData[0].id) {
          await supabase
            .from('prototype_shares' as any)
            .update({ accessed_at: new Date().toISOString() })
            .eq('id', typedShareData[0].id);
        }
        
        // Now fetch the prototype details
        const { data: prototypeData, error: prototypeError } = await supabase
          .from('prototypes')
          .select('*, profiles:created_by(name, avatar_url)')
          .eq('id', id)
          .single();
          
        if (prototypeError) {
          throw prototypeError;
        }
        
        return prototypeData;
      } catch (error) {
        console.error("Error fetching shared prototype:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch the requested prototype"
        });
        throw error;
      }
    },
    enabled: !!id
  });

  useEffect(() => {
    if (prototype?.deployment_status === 'processing') {
      const intervalId = setInterval(() => {
        refetch();
      }, 5000);
      
      const timeoutId = setTimeout(() => {
        setProcessingTimeout(true);
      }, 60000);
      
      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    } else {
      setProcessingTimeout(false);
    }
  }, [prototype?.deployment_status, refetch]);

  const handleBackToLogin = () => {
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-sm text-muted-foreground">Loading prototype...</p>
        </div>
      </div>
    );
  }

  if (error || !prototype) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-card p-6 rounded-lg shadow-sm border max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            This prototype either doesn't exist or is not publicly shared. You may need to log in to access it.
          </p>
          <Button variant="default" onClick={handleBackToLogin}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const creatorName = prototype.profiles?.name || 'Anonymous';
  const creatorAvatar = prototype.profiles?.avatar_url;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Always show creator info and back button in shared view */}
      <div className="bg-background p-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            {creatorAvatar ? (
              <AvatarImage src={creatorAvatar} alt={creatorName} />
            ) : (
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm font-medium">Created by {creatorName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBackToLogin} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Login</span>
        </Button>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">
          {id && (
            <PreviewWindow 
              prototypeId={id} 
              url={prototype?.deployment_url} 
            />
          )}
        </div>

        {prototype?.deployment_status === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 text-primary animate-spin">
                  <RefreshCw className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold">Deployment in progress...</h2>
              </div>
              <p className="text-muted-foreground mb-4">This prototype is being prepared. This may take a moment.</p>
              
              {processingTimeout && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Taking longer than expected</p>
                    <p className="text-xs text-amber-700 mt-1">
                      The deployment is taking longer than usual. You can continue waiting or try again later.
                    </p>
                  </div>
                </div>
              )}
              
              <Button onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? 'Checking...' : 'Check Status'}
              </Button>
            </div>
          </div>
        )}

        {prototype?.deployment_status === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-md">
              <h2 className="text-xl font-semibold text-destructive mb-2">Deployment Failed</h2>
              <p className="text-muted-foreground mb-4">
                There was an issue deploying this prototype.
              </p>
              <Button onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? 'Checking...' : 'Check Again'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
