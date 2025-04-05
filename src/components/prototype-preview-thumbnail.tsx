
import { useEffect, useState } from "react";
import { Prototype } from "@/types/prototype";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  prototype: Prototype;
}

export function PrototypePreviewThumbnail({ prototype }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        // Handle different prototype types
        if (prototype.type === 'figma' && prototype.figma_url) {
          setPreviewUrl('/placeholder.svg');
          setIsLoading(false);
          return;
        }
        
        if (prototype.type === 'external') {
          setPreviewUrl('/placeholder.svg');
          setIsLoading(false);
          return;
        }

        // If there's a preview_image, use it
        if (prototype.preview_image) {
          setPreviewUrl(prototype.preview_image);
          setIsLoading(false);
          return;
        }

        // Use preview_url if available
        if (prototype.preview_url) {
          setPreviewUrl(prototype.preview_url);
          setIsLoading(false);
          return;
        }

        // For uploaded prototypes with deployment_url
        if (prototype.deployment_url) {
          setPreviewUrl(prototype.deployment_url);
          setIsLoading(false);
          return;
        }

        // Default placeholder
        setPreviewUrl('/placeholder.svg');
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading preview:", error);
        setPreviewUrl('/placeholder.svg');
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [prototype]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary/20">
        <Loader2 className="w-6 h-6 animate-spin opacity-70" />
      </div>
    );
  }

  if (prototype.type === 'figma' && prototype.figma_url) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <img 
          src="/placeholder.svg" 
          alt={prototype.name} 
          className="w-1/2 h-1/2 object-contain opacity-40"
        />
        <div className="absolute bottom-3 right-3 bg-white/90 text-xs px-2 py-1 rounded-sm shadow-sm">
          Figma
        </div>
      </div>
    );
  }

  if (prototype.type === 'external') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <img 
          src="/placeholder.svg" 
          alt={prototype.name} 
          className="w-1/2 h-1/2 object-contain opacity-40"
        />
        <div className="absolute bottom-3 right-3 bg-white/90 text-xs px-2 py-1 rounded-sm shadow-sm">
          External
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-white">
      {previewUrl ? (
        <img 
          src={previewUrl} 
          alt={prototype.name} 
          className="w-full h-full object-cover"
          onError={() => setPreviewUrl('/placeholder.svg')}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">No preview</span>
        </div>
      )}
      
      {prototype.deployment_status === 'pending' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
