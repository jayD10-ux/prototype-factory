
import React, { useRef, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface PreviewFallbackProps {
  files: Record<string, string>;
  mainFile: string;
  errorMessage?: string;
}

export function PreviewFallback({ files, mainFile, errorMessage }: PreviewFallbackProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // Create a simple HTML preview if we have HTML content
    if (files[mainFile] && mainFile.endsWith('.html') && iframeRef.current) {
      const blob = new Blob([files[mainFile]], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      iframeRef.current.src = url;
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [files, mainFile]);
  
  if (errorMessage) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="max-w-md p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{errorMessage}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  if (!files[mainFile]) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full bg-white">
      <iframe
        ref={iframeRef}
        title="Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
