import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { UploadPrototypeDialog } from "./upload-prototype-dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSupabase } from "@/lib/supabase-provider";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AddPrototypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPrototypeDialog({
  open,
  onOpenChange,
}: AddPrototypeDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { isAuthenticated, user } = useSupabase();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaName, setFigmaName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [externalName, setExternalName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const handleFigmaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!figmaName.trim() || !figmaUrl.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: prototype, error } = await supabase
        .from("prototypes")
        .insert({
          name: figmaName.trim(),
          created_by: user?.id,
          url: figmaUrl.trim(),
          figma_url: figmaUrl.trim(),
          deployment_status: "completed",
          type: "figma",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Figma prototype added successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["prototypes"] });
      onOpenChange(false);
      navigate(`/prototype/${prototype.id}`);
    } catch (error: any) {
      console.error("Error adding Figma prototype:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add Figma prototype",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExternalUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalName.trim() || !externalUrl.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: prototype, error } = await supabase
        .from("prototypes")
        .insert({
          name: externalName.trim(),
          created_by: user?.id,
          url: externalUrl.trim(),
          deployment_status: "completed",
          type: "external",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "External prototype added successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["prototypes"] });
      onOpenChange(false);
      navigate(`/prototype/${prototype.id}`);
    } catch (error: any) {
      console.error("Error adding external prototype:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add external prototype",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-semibold mb-4">
          Add New Prototype
        </DialogTitle>
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="upload">Upload Code</TabsTrigger>
            <TabsTrigger value="figma">Figma Link</TabsTrigger>
            <TabsTrigger value="url">External URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-0">
            <UploadPrototypeDialog
              onUpload={() => onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent value="figma" className="mt-0">
            <form onSubmit={handleFigmaSubmit} className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Add a Figma prototype by pasting a public share link from Figma
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="figmaName" className="text-right">
                  Name
                </Label>
                <Input 
                  id="figmaName" 
                  value={figmaName} 
                  onChange={e => setFigmaName(e.target.value)} 
                  className="col-span-3" 
                  placeholder="Enter prototype name" 
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="figmaUrl" className="text-right">
                  Figma URL
                </Label>
                <Input 
                  id="figmaUrl" 
                  value={figmaUrl} 
                  onChange={e => setFigmaUrl(e.target.value)} 
                  className="col-span-3" 
                  placeholder="https://www.figma.com/file/..." 
                  type="url" 
                  required 
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Prototype"}
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="url" className="mt-0">
            <form onSubmit={handleExternalUrlSubmit} className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Add a link to an external prototype or website
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="externalName" className="text-right">
                  Name
                </Label>
                <Input 
                  id="externalName" 
                  value={externalName} 
                  onChange={e => setExternalName(e.target.value)} 
                  className="col-span-3" 
                  placeholder="Enter prototype name" 
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="externalUrl" className="text-right">
                  External URL
                </Label>
                <Input 
                  id="externalUrl" 
                  value={externalUrl} 
                  onChange={e => setExternalUrl(e.target.value)} 
                  className="col-span-3" 
                  placeholder="https://..." 
                  type="url" 
                  required 
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Prototype"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
