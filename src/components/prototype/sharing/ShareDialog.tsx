
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototypeId: string;
  prototypeName?: string;
}

export function ShareDialog({ open, onOpenChange, prototypeId, prototypeName = 'Prototype' }: ShareDialogProps) {
  const { toast } = useToast();
  const shareLink = `${window.location.origin}/p/${prototypeId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Link has been copied to clipboard"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {prototypeName}</DialogTitle>
          <DialogDescription>
            Share your prototype with others
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex space-x-2">
          <Input
            value={shareLink}
            readOnly
            className="flex-1"
          />
          <Button type="submit" size="sm" onClick={handleCopyLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
