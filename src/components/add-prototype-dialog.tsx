
// Update the component to use isLoaded from the ClerkAuth context
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { UploadPrototypeDialog } from "./upload-prototype-dialog";
import { Button } from "./ui/button";
import { useClerkAuth } from "@/lib/clerk-provider";

interface AddPrototypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPrototypeDialog({
  open,
  onOpenChange,
}: AddPrototypeDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { isLoaded, isAuthenticated } = useClerkAuth();

  if (!isLoaded || !isAuthenticated) {
    return null;
  }

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
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Add a Figma prototype by pasting a public share link from Figma
                </p>
              </div>
              {/* Figma link form component would go here */}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="url" className="mt-0">
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Add a link to an external prototype or website
                </p>
              </div>
              {/* External URL form component would go here */}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
