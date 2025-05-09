
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, Upload } from "lucide-react";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { validatePrototypeZip } from "@/utils/zip-utils";
import { useSupabase } from "@/lib/supabase-provider";

interface UploadPrototypeDialogProps {
  onUpload?: () => void;
}

export function UploadPrototypeDialog({ onUpload }: UploadPrototypeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [prototypeName, setPrototypeName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated, user, supabase } = useSupabase();

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'text/html': ['.html', '.htm'],
      'application/zip': ['.zip']
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      toast({
        title: "Upload Error",
        description: error?.message || "Invalid file",
        variant: "destructive",
      });
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("[UploadPrototype] Starting upload process");
    console.log("[UploadPrototype] Auth state:", { isAuthenticated, userId: user?.id });
    
    if (!isAuthenticated || !user) {
      console.error("[UploadPrototype] Authentication required but user not authenticated");
      toast({
        title: "Authentication required",
        description: "Please sign in to upload prototypes",
        variant: "destructive",
      });
      return;
    }

    if (!prototypeName.trim()) {
      console.error("[UploadPrototype] No prototype name provided");
      toast({
        title: "Name required",
        description: "Please enter a name for your prototype",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedFiles.length) {
      console.error("[UploadPrototype] No file selected");
      toast({
        title: "File required",
        description: "Please upload a HTML/ZIP file",
        variant: "destructive",
      });
      return;
    }

    const file = acceptedFiles[0];
    setIsLoading(true);

    try {
      console.log("[UploadPrototype] Processing file:", file.name, "type:", file.type);
      
      // If ZIP file, validate it first
      if (file.type === 'application/zip') {
        console.log("[UploadPrototype] Validating ZIP file");
        try {
          await validatePrototypeZip(file);
          console.log("[UploadPrototype] ZIP validation successful");
        } catch (error: any) {
          console.error("[UploadPrototype] ZIP validation failed:", error);
          toast({
            title: "Invalid ZIP file",
            description: error.message || "The ZIP file doesn't contain valid web content",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log("[UploadPrototype] Uploading file to path:", filePath);
      
      // Upload file to storage
      const { error: uploadError } = await supabase
        .storage
        .from('prototype-uploads')
        .upload(filePath, file);

      if (uploadError) {
        console.error("[UploadPrototype] Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("[UploadPrototype] File uploaded successfully, inserting prototype record");
      console.log("[UploadPrototype] User ID for record:", user.id);
      
      // Insert prototype record with Supabase user ID
      const { data: prototype, error: insertError } = await supabase
        .from('prototypes')
        .insert({
          name: prototypeName.trim(),
          created_by: user.id,
          url: null,
          file_path: filePath,
          type: 'upload',
          deployment_status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error("[UploadPrototype] Database insert error:", insertError);
        throw insertError;
      }

      console.log("[UploadPrototype] Prototype record created:", prototype);
      
      toast({
        title: "Success",
        description: "Prototype uploaded successfully. Processing will begin shortly.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['prototypes'] });
      
      if (onUpload) {
        onUpload();
      }

      navigate(`/prototype/${prototype.id}`);

    } catch (error: any) {
      console.error("[UploadPrototype] Error uploading prototype:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload prototype",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fileDisplay = acceptedFiles.length > 0 ? (
    <div className="mt-4 p-2 bg-muted rounded-lg">
      <p className="text-sm truncate">{acceptedFiles[0].name}</p>
      <p className="text-xs text-muted-foreground">
        {(acceptedFiles[0].size / 1024).toFixed(1)} KB
      </p>
    </div>
  ) : null;

  return (
    <div className="space-y-4 py-2 pb-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Upload a HTML file or ZIP archive containing your prototype
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="prototypeName" className="text-right">
            Name
          </Label>
          <Input
            id="prototypeName"
            value={prototypeName}
            onChange={(e) => setPrototypeName(e.target.value)}
            className="col-span-3"
            placeholder="Enter prototype name"
            disabled={isLoading}
            required
          />
        </div>

        <Card className="border-dashed">
          <div
            {...getRootProps()}
            className={`p-10 text-center cursor-pointer hover:bg-muted/50 transition-colors rounded-lg flex flex-col items-center justify-center ${
              isDragActive ? "bg-muted" : ""
            }`}
          >
            <input {...getInputProps()} accept=".html,.htm,.zip" />
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              Drag & drop your files here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to select files (HTML or ZIP)
            </p>
            {fileDisplay}
          </div>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={onUpload} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
