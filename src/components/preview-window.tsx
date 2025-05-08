
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Link } from 'lucide-react';

interface PreviewWindowProps {
  deploymentId?: string;
  url?: string;
  onShare?: () => void;
}

export function PreviewWindow({ deploymentId, url, onShare }: PreviewWindowProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const getPreviewUrl = async () => {
      try {
        if (url) {
          // If a direct URL is provided, use it
          setPreviewUrl(url);
          setIsLoading(false);
          return;
        }

        if (!deploymentId) {
          console.error("No deploymentId or URL provided to PreviewWindow");
          setIsLoading(false);
          return;
        }

        // Get URL from storage
        const { data } = await supabase.storage
          .from('prototype-deployments')
          .getPublicUrl(`${deploymentId}/index.html`);

        if (data && data.publicUrl) {
          setPreviewUrl(data.publicUrl);
        } else {
          console.error("Could not get public URL for prototype", deploymentId);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading preview:", error);
        setIsLoading(false);
      }
    };

    getPreviewUrl();

    // Clean up on unmount
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
    };
  }, [deploymentId, url]);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden rounded-lg border">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {!isLoading && !previewUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center p-4">
            <p className="text-muted-foreground mb-2">No preview available</p>
          </div>
        </div>
      )}
      {previewUrl && (
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="h-full w-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation allow-top-navigation-by-user-activation"
          title="Prototype Preview"
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );
}
