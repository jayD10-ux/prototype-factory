
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { unzipToFiles } from "@/utils/zip-utils";
import { Sandpack } from "@codesandbox/sandpack-react";
import { PreviewFallback } from "./PreviewFallback";
// Remove problematic CSS import and only use our custom CSS
import "@/styles/sandpack-fix.css";

interface SandpackPreviewProps {
  prototypeId: string;
  url?: string;
  figmaUrl?: string | null;
  filesUrl?: string | null;
  onShare?: () => void;
}

export function SandpackPreview({
  prototypeId,
  url,
  figmaUrl,
  filesUrl,
  onShare,
}: SandpackPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [entryFile, setEntryFile] = useState("index.html");
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchPrototypeFiles = async () => {
      console.log("Fetching prototype file data for ID:", prototypeId);
      setIsLoading(true);
      setError(null);

      try {
        // Get user profile for console logging
        const { data: userData } = await supabase.auth.getSession();
        console.log("Current user profile:", userData.session?.user);

        // Get prototype info to find file path
        const { data: prototype, error: protoError } = await supabase
          .from("prototypes")
          .select("file_path")
          .eq("id", prototypeId)
          .single();

        if (protoError || !prototype || !prototype.file_path) {
          console.error("Error fetching prototype:", protoError);
          setError(
            "Could not load prototype files. The prototype may not exist or you don't have permission to view it."
          );
          setIsLoading(false);
          return;
        }

        console.log("Fetching file from storage:", prototype.file_path);

        // Get the prototype zip file
        const { data: fileData, error: fileError } = await supabase.storage
          .from("prototype-uploads")
          .download(prototype.file_path);

        if (fileError || !fileData) {
          console.error("Error downloading prototype file:", fileError);
          setError("Could not download prototype files");
          setIsLoading(false);
          return;
        }

        // Process the zip file
        const extractedFiles = await unzipToFiles(fileData);
        const fileKeys = Object.keys(extractedFiles);
        console.log(
          "Creating Sandpack project with files:",
          fileKeys.map((key) => key)
        );

        // Determine the entry file (prefer index.html)
        let mainFile = "index.html";
        if (!fileKeys.includes(mainFile)) {
          const htmlFiles = fileKeys.filter((file) => file.endsWith(".html"));
          if (htmlFiles.length > 0) {
            mainFile = htmlFiles[0];
          }
        }

        setFiles(extractedFiles);
        setEntryFile(mainFile);
        console.log("Sandpack project loaded successfully");
        setIsLoading(false);
      } catch (error) {
        console.error("Error setting up Sandpack:", error);
        setError("Error preparing prototype preview");
        setIsLoading(false);
      }
    };

    fetchPrototypeFiles();
  }, [prototypeId]);

  const handleShare = useCallback(() => {
    if (onShare) {
      onShare();
    } else if (filesUrl) {
      // Use window.location.href as fallback for copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(
        () => {
          toast({
            title: "Link copied!",
            description: "Prototype link copied to clipboard",
          });
        },
        () => {
          toast({
            variant: "destructive",
            title: "Copy failed",
            description:
              "Could not copy link to clipboard. Please copy it manually.",
          });
        }
      );
    }
  }, [onShare, filesUrl, toast]);

  // Error handling for Sandpack
  const handleSandpackError = useCallback(() => {
    console.error("Sandpack failed to render, using fallback");
    setUseFallback(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading prototype files...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="max-w-md p-6 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (useFallback) {
    return <PreviewFallback files={files} mainFile={entryFile} />;
  }

  // Only show sharing controls if the onShare prop is provided
  const showShareButton = !!onShare;

  try {
    return (
      <div className="h-full relative">
        <div className="h-full">
          <Sandpack
            template="static"
            files={files}
            options={{
              activeFile: entryFile,
              visibleFiles: [entryFile],
              editorHeight: "0px", // Hide editor
              showNavigator: false,
              showLineNumbers: false,
              showInlineErrors: false,
              showTabs: false,
              closableTabs: false,
              wrapContent: false,
              readOnly: true,
              showConsole: false,
              showConsoleButton: false,
            }}
            customSetup={{
              entry: entryFile,
              environment: "static",
            }}
            theme="light"
            key={prototypeId} // Force re-render when prototype ID changes
          />
        </div>
      </div>
    );
  } catch (err) {
    console.error("Sandpack render error:", err);
    return <PreviewFallback files={files} mainFile={entryFile} />;
  }
}
