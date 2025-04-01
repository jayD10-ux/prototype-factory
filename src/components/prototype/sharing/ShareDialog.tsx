
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2 } from "lucide-react";
import { useSupabase } from "@/lib/supabase-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePrototypeSharing } from '@/hooks/use-prototype-sharing';
import { ShareFormData } from '@/types/prototype-sharing';

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototypeId: string;
  prototypeName?: string;
}

export function ShareDialog({ open, onOpenChange, prototypeId, prototypeName = 'Prototype' }: ShareDialogProps) {
  const { toast } = useToast();
  const { session } = useSupabase();
  const [activeTab, setActiveTab] = useState("link");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit" | "admin">("view");
  const [isPublic, setIsPublic] = useState(true);

  const {
    shares,
    isLoadingShares,
    isCreatingShare,
    isUpdatingShare,
    isDeletingShare,
    createEmailShare,
    updateLinkShare,
    updateSharePermission,
    removeShare,
    getLinkShare,
    getEmailShares
  } = usePrototypeSharing(prototypeId);

  // Initialize link share setting based on existing data
  useEffect(() => {
    const linkShare = getLinkShare();
    if (linkShare) {
      setIsPublic(linkShare.is_public);
      setPermission(linkShare.permission as "view" | "edit" | "admin");
    }
  }, [shares]);

  const emailShares = getEmailShares();
  const linkShare = getLinkShare();
  const shareLink = linkShare ? `${window.location.origin}/p/${prototypeId}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Link has been copied to clipboard"
    });
  };

  const handleShareByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter an email address"
      });
      return;
    }
    
    const shareData: ShareFormData = {
      email: email.trim(),
      permission
    };
    
    await createEmailShare(shareData);
    setEmail("");
  };

  const handleUpdateLinkSettings = async () => {
    await updateLinkShare({
      is_public: isPublic,
      permission
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {prototypeName}</DialogTitle>
          <DialogDescription>
            Share your prototype with others via link or email
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="public-share" 
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public-share">Anyone with the link</Label>
              </div>
              
              <Select 
                value={permission} 
                onValueChange={(value) => setPermission(value as "view" | "edit" | "admin")}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
            
            <Button 
              onClick={handleUpdateLinkSettings}
              disabled={isUpdatingShare}
              className="w-full"
            >
              {isUpdatingShare ? "Updating..." : "Update link settings"}
            </Button>
          </TabsContent>
          
          <TabsContent value="people" className="space-y-4">
            <form onSubmit={handleShareByEmail} className="flex space-x-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                type="email"
                className="flex-1"
              />
              <Select 
                value={permission} 
                onValueChange={(value) => setPermission(value as "view" | "edit" | "admin")}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isCreatingShare}>
                {isCreatingShare ? "Sharing..." : "Share"}
              </Button>
            </form>
            
            <div className="space-y-2">
              {isLoadingShares && <p className="text-sm text-muted-foreground">Loading shares...</p>}
              
              {!isLoadingShares && emailShares.length === 0 && (
                <p className="text-sm text-muted-foreground">No one has been added yet</p>
              )}
              
              {emailShares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{share.email?.[0].toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{share.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={share.permission} 
                      onValueChange={(value) => updateSharePermission(share.id, value as "view" | "edit" | "admin")}
                    >
                      <SelectTrigger className="h-8 w-[80px]">
                        <SelectValue placeholder="Permission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View</SelectItem>
                        <SelectItem value="edit">Edit</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeShare(share.id)}
                      disabled={isDeletingShare}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
