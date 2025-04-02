import { useState, useEffect } from "react";
import { Prototype } from "@/types/prototype";

interface PrototypePreviewThumbnailProps {
  prototype: Prototype;
  className?: string;
}

export function PrototypePreviewThumbnail({ prototype, className = "" }: PrototypePreviewThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Add key to force iframe refresh

  // Try deployment URL first, then preview URL, then sandbox URL if available
  const getPreviewUrl = () => {
    if (prototype.deployment_status === 'deployed' && prototype.deployment_url) {
      return prototype.deployment_url;
    }
    if (prototype.preview_url) {
      return prototype.preview_url;
    }
    if (prototype.sandbox_config) {
      // If we have sandbox config, we could potentially render a sandbox preview
      return null;
    }
    return null;
  };

  const previewUrl = getPreviewUrl();
  const hasValidPreview = !!previewUrl;

  // Add debug logging
  useEffect(() => {
    if (prototype.id) {
      console.debug(`Prototype ${prototype.id} preview status:`, {
        deployment_url: prototype.deployment_url,
        deployment_status: prototype.deployment_status,
        preview_url: prototype.preview_url,
        sandbox_config: prototype.sandbox_config,
        final_url: previewUrl
      });
    }
  }, [prototype, previewUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    setPreviewError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setPreviewError(true);
    console.error(`Preview load error for prototype ${prototype.id}:`, previewUrl);
    // Attempt to reload once
    if (iframeKey === 0) {
      setIframeKey(1);
    }
  };

  const renderPreview = () => {
    if (!hasValidPreview) {
      return (
        <div className="flex items-center justify-center h-full bg-muted/50">
          <p className="text-sm text-muted-foreground">No preview available</p>
        </div>
      );
    }

    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-foreground"></div>
          </div>
        )}
        <iframe
          key={iframeKey}
          src={previewUrl}
          title={`Preview of ${prototype.name}`}
          className="w-full h-full border-none"
          style={{ 
            opacity: isLoading ? 0 : 1, 
            transition: "opacity 0.3s ease",
            pointerEvents: "none" // Prevent interaction with iframe in card view
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
        />
      </>
    );
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {previewError ? (
        <div className="flex items-center justify-center h-full bg-muted/50">
          <p className="text-sm text-muted-foreground">Failed to load preview</p>
        </div>
      ) : (
        renderPreview()
      )}
    </div>
  );
}
