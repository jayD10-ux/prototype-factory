import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShareDialog } from './prototype/sharing/ShareDialog';
import '@/styles/PreviewIframe.css';
import { SandpackPreview } from './SandpackPreview';

interface PreviewWindowProps {
  url?: string | null;
  onShare?: () => void;
  prototypeId: string;
}

export function PreviewWindow({ prototypeId, url, onShare }: PreviewWindowProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [figmaUrl, setFigmaUrl] = useState<string | null>(null);
  const [filesUrl, setFilesUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useSandpack, setUseSandpack] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [prototypeName, setPrototypeName] = useState<string>('Prototype');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useIsMobile();
  
  const fetchPrototypeUrl = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // If url is provided, use it directly
      if (url) {
        console.log("Using provided URL:", url);
        setPreviewUrl(url);
        return;
      }

      // Get prototype details
      const { data: prototype, error: prototypeError } = await supabase
        .from('prototypes')
        .select('name, file_path, deployment_status, deployment_url')
        .eq('id', prototypeId)
        .single();

      if (prototypeError) {
        console.error('Error fetching prototype:', prototypeError);
        setLoadError("Failed to load prototype");
        return;
      }

      if (!prototype) {
        setLoadError("Prototype not found");
        return;
      }

      // Set prototype name
      setPrototypeName(prototype.name || 'Untitled');

      // Get file URL if available
      if (prototype.file_path) {
        const { data: { publicUrl } } = await supabase
          .storage
          .from('prototype-uploads')
          .getPublicUrl(prototype.file_path);
        
        setFilesUrl(publicUrl);
      }

      // Set preview URL based on deployment status
      if (prototype.deployment_status === 'deployed' && prototype.deployment_url) {
        setPreviewUrl(prototype.deployment_url);
      } else if (prototype.file_path) {
        setUseSandpack(true);
      } else {
        setLoadError("No preview available");
      }
    } catch (error) {
      console.error("Error loading preview:", error);
      setLoadError("Failed to load preview");
    } finally {
      setIsLoading(false);
    }
  }, [prototypeId, url]);

  // For demo purposes, let's set a hardcoded Figma URL if none is provided
  useEffect(() => {
    // Only set a demo URL if figmaUrl is null and we're in development
    if (figmaUrl === null && process.env.NODE_ENV === 'development') {
      setFigmaUrl('https://www.figma.com/file/LKQ4FJ4bTnCSjedbRpk931/Sample-File');
    }
  }, [figmaUrl]);

  // Cleanup on unmount
  useEffect(() => {
    fetchPrototypeUrl();

    return () => {
      if (iframeRef.current) {
        // Clean up any iframe resources
        iframeRef.current.src = 'about:blank';
      }
    };
  }, [fetchPrototypeUrl]);

  // Handle share button click - now opens our share dialog
  const handleShare = useCallback(() => {
    setShowShareDialog(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive">{loadError}</p>
        </div>
      </div>
    );
  }

  if (useSandpack) {
    return (
      <>
        <SandpackPreview />
        {/* Additional components and rendering for Sandpack mode */}
        <div className="h-full w-full">
          {/* Insert iframe or other content here if needed */}
          <iframe
            src={filesUrl || previewUrl || ""}
            className={`w-full h-full border-0 preview-iframe ${isMobile ? 'mobile-preview' : ''}`}
            title="Preview"
            sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
            loading="lazy"
          />
        </div>
        
        <ShareDialog 
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          prototypeId={prototypeId}
          prototypeName={prototypeName}
        />
      </>
    );
  }

  return (
    <>
      <div className="h-full w-full">
        <iframe 
          ref={iframeRef}
          src={previewUrl} 
          className={`w-full h-full border-0 preview-iframe ${isMobile ? 'mobile-preview' : ''}`}
          title="Preview"
          sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
          loading="lazy"
        />
      </div>
      
      <ShareDialog 
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        prototypeId={prototypeId}
        prototypeName={prototypeName}
      />
    </>
  );
}
