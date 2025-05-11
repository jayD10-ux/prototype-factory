
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { PreviewControls } from './preview/PreviewControls';
import { FeedbackOverlay } from './feedback/FeedbackOverlay';
import { cn } from '@/lib/utils';
import '@/styles/sandpack-fix.css';
import '@/styles/PreviewIframe.css';

interface SandpackPreviewProps {
  files: string;  // URL to the ZIP file
  mainFile: string; // Path to the main HTML file in the ZIP
  prototypeId?: string;
  onShare?: () => void;
  onDownload?: () => void;
}

type ViewMode = 'preview' | 'code' | 'split' | 'design';
type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function SandpackPreview({ files, mainFile, prototypeId, onShare, onDownload }: SandpackPreviewProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the ZIP file
        const response = await fetch(files);
        const zipBlob = await response.blob();
        
        // Load and extract ZIP
        const zip = await JSZip.loadAsync(zipBlob);
        
        // Get the main HTML file
        const htmlFile = zip.file(mainFile);
        if (!htmlFile) {
          throw new Error(`Main file ${mainFile} not found in ZIP`);
        }
        
        // Get HTML content
        const htmlContent = await htmlFile.async('string');
        
        // Create a blob URL for the HTML content
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(htmlBlob);
        
        setContent(url);
      } catch (err: any) {
        console.error('Error loading preview:', err);
        setError(err.message || 'Failed to load preview');
        toast.error('Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    }

    if (files) {
      loadContent();
    }

    // Cleanup
    return () => {
      if (content) {
        URL.revokeObjectURL(content);
      }
    };
  }, [files, mainFile]);

  const handleRefresh = () => {
    if (content) {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        iframe.src = content;
      }
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleDeviceChange = (device: DeviceType) => {
    setDeviceType(device);
  };

  const handleOrientationChange = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  const deviceStyles = {
    mobile: { width: '375px', height: '667px' },
    tablet: { width: '768px', height: '1024px' },
    desktop: { width: '100%', height: '100%' }
  };

  const currentStyles = deviceStyles[deviceType];
  const rotatedStyles = orientation === 'landscape' && deviceType !== 'desktop'
    ? { width: currentStyles.height, height: currentStyles.width }
    : currentStyles;

  return (
    <div className="flex flex-col h-full">
      {showUI && (
        <PreviewControls
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isFeedbackMode={isFeedbackMode}
          onToggleFeedbackMode={() => setIsFeedbackMode(prev => !prev)}
          showUI={showUI}
          onToggleUI={() => setShowUI(prev => !prev)}
          deviceType={deviceType}
          orientation={orientation}
          onDeviceChange={handleDeviceChange}
          onOrientationChange={handleOrientationChange}
          scale={scale}
          onScaleChange={setScale}
          onRefresh={handleRefresh}
          onShare={onShare}
          onDownload={onDownload}
          filesUrl={files}
        />
      )}

      <div className="flex-1 relative overflow-hidden">
        <div 
          className={cn(
            "transition-all duration-300 absolute inset-0 flex items-center justify-center",
            !showUI && "p-0"
          )}
        >
          <div 
            style={{
              ...rotatedStyles,
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              transition: 'transform 0.3s ease'
            }}
            className="bg-white relative shadow-lg overflow-hidden preview-iframe"
          >
            <iframe
              src={content}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
              allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
              loading="lazy"
            />
          </div>
        </div>

        {isFeedbackMode && prototypeId && (
          <FeedbackOverlay
            prototypeId={prototypeId}
            onClose={() => setIsFeedbackMode(false)}
          />
        )}
      </div>
    </div>
  );
}

