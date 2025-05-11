
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface SandpackPreviewProps {
  files: string;  // URL to the ZIP file
  mainFile: string; // Path to the main HTML file in the ZIP
}

export function SandpackPreview({ files, mainFile }: SandpackPreviewProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <iframe
      src={content}
      className="w-full h-full border-0"
      title="Preview"
      sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
      allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
      loading="lazy"
    />
  );
}

