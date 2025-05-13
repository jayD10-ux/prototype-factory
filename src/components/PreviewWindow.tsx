
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
  const [filesUrl, setFilesUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useSandpack, setUseSandpack] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [prototypeName, setPrototypeName] = useState<string>('Prototype');
  const [mainFile, setMainFile] = useState<string>('index.html');
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
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
        throw prototypeError;
      }

      if (!prototype) {
        console.error('Error fetching prototype: no data');
        setLoadError("Failed to load prototype");
        return;
      }

      setPrototypeName(prototype.name);
      setMainFile('index.html'); // Default to index.html since we don't have main_file column yet

      if (prototype.file_path) {
        const { data } = await supabase
          .storage
          .from('prototype-uploads')
          .getPublicUrl(prototype.file_path);

        setFilesUrl(data.publicUrl);

        if (prototype.file_path.endsWith('.zip')) {
          // We'll use SandpackPreview for ZIP files
          setUseSandpack(true);
        } else {
          // For direct HTML files, we can use the URL directly
          setPreviewUrl(data.publicUrl);
        }
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

  // Toggle feedback mode
  const toggleFeedbackMode = useCallback(() => {
    setIsFeedbackMode(prev => !prev);
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
        <div className="h-full w-full">
          <SandpackPreview 
            files={filesUrl || ''}
            mainFile={mainFile}
            prototypeId={prototypeId}
            onShare={handleShare}
            onDownload={() => {
              if (filesUrl) {
                window.open(filesUrl, '_blank');
              }
            }}
            isFeedbackMode={isFeedbackMode}
            onToggleFeedbackMode={toggleFeedbackMode}
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
