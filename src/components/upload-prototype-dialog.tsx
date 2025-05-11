
import { useState, useEffect } from "react";
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
  const { supabase } = useSupabase();



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
      
      // Process the file based on type
      let mainFile = '';
      if (file.type === 'application/zip') {
        console.log("[UploadPrototype] Processing ZIP file");
        try {
          const zip = await JSZip.loadAsync(file);
          const files = Object.keys(zip.files);
          
          // Find index.html in root or first HTML file
          mainFile = files.find(f => f === 'index.html') || 
                     files.find(f => f.endsWith('.html')) || '';
          
          if (!mainFile) {
            throw new Error("No HTML file found in ZIP");
          }
          
          console.log("[UploadPrototype] Main file found:", mainFile);
        } catch (error: any) {
          console.error("[UploadPrototype] ZIP processing failed:", error);
          toast({
            title: "Invalid ZIP file",
            description: error.message || "The ZIP file doesn't contain valid web content",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else {
        // For direct HTML files
        mainFile = file.name;
      }



      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `uploads/${timestamp}/${fileName}`;
      
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
      
      // Insert prototype record
      const { data: prototype, error: insertError } = await supabase
        .from('prototypes')
        .insert({
          name: prototypeName.trim(),
          url: '',
          file_path: filePath,
          main_file: mainFile,  // Store the main HTML file path
          type: 'upload',
          deployment_status: 'ready',  // Set to ready since we don't need deployment
          created_by: null
        })
        .select();

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

      // Navigate to the prototype details page
      if (prototype && prototype.length > 0) {
        navigate(`/prototype/${prototype[0].id}`);
      } else {
        console.error("[UploadPrototype] No prototype record returned after insert");
      }

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
