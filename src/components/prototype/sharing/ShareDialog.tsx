
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabase } from "@/lib/supabase-provider";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail, Link, Check, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Permission = "view" | "comment" | "edit";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototypeId: string;
  prototypeName?: string;
}

interface ShareRecipient {
  email: string;
  permission: Permission;
}

interface Share {
  id: string;
  email: string;
  permission: Permission;
  created_at: string;
  shared_by: {
    name: string;
    avatar_url: string;
  };
}

export function ShareDialog({ 
  open, 
  onOpenChange, 
  prototypeId,
  prototypeName = "Prototype"
}: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState<"link" | "email">("link");
  const [recipient, setRecipient] = useState<string>("");
  const [permission, setPermission] = useState<Permission>("view");
  const [linkPermission, setLinkPermission] = useState<Permission>("view");
  const [isPublicLink, setIsPublicLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkId, setLinkId] = useState<string | null>(null);
  
  const { session } = useSupabase();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  
  // Query to get existing shares
  const { data: shares = [] } = useQuery({
    queryKey: ["prototype-shares", prototypeId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("prototype_shares")
          .select(`
            id,
            email,
            permission,
            created_at,
            shared_by:profiles!prototype_shares_shared_by_fkey(name, avatar_url)
          `)
          .eq("prototype_id", prototypeId)
          .eq("is_link_share", false);
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching shares:", error);
        return [];
      }
    },
    enabled: !!prototypeId && !!userId && open,
  });
  
  // Query to get existing link share
  const { data: linkShare, refetch: refetchLinkShare } = useQuery({
    queryKey: ["prototype-link-share", prototypeId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("prototype_shares")
          .select("id, permission, is_public")
          .eq("prototype_id", prototypeId)
          .eq("is_link_share", true)
          .single();
          
        if (error) {
          if (error.code === "PGRST116") {
            // No link share found
            return null;
          }
          throw error;
        }
        
        if (data) {
          setLinkPermission(data.permission as Permission);
          setIsPublicLink(data.is_public);
          setLinkId(data.id);
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching link share:", error);
        return null;
      }
    },
    enabled: !!prototypeId && !!userId && open,
  });
  
  // Mutation to add a new share
  const addShareMutation = useMutation({
    mutationFn: async ({ email, permission }: { email: string; permission: Permission }) => {
      const { data, error } = await supabase
        .from("prototype_shares")
        .insert({
          prototype_id: prototypeId,
          shared_by: userId,
          email,
          permission,
          is_link_share: false
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Share added",
        description: `Successfully shared with ${recipient}`,
      });
      setRecipient("");
      queryClient.invalidateQueries({ queryKey: ["prototype-shares", prototypeId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to share: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to create or update link share
  const linkShareMutation = useMutation({
    mutationFn: async ({ permission, isPublic }: { permission: Permission; isPublic: boolean }) => {
      let query;
      
      if (linkId) {
        // Update existing link share
        query = supabase
          .from("prototype_shares")
          .update({
            permission,
            is_public: isPublic
          })
          .eq("id", linkId)
          .select();
      } else {
        // Create new link share
        query = supabase
          .from("prototype_shares")
          .insert({
            prototype_id: prototypeId,
            shared_by: userId,
            permission,
            is_link_share: true,
            is_public: isPublic
          })
          .select();
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Set linkId for future updates
      if (data && data[0]) {
        setLinkId(data[0].id);
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Link created",
        description: "Share link has been created",
      });
      refetchLinkShare();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create share link: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to delete a share
  const deleteShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from("prototype_shares")
        .delete()
        .eq("id", shareId);
        
      if (error) throw error;
      return shareId;
    },
    onSuccess: (shareId) => {
      toast({
        title: "Share removed",
        description: "Successfully removed share",
      });
      queryClient.invalidateQueries({ queryKey: ["prototype-shares", prototypeId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove share: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Function to handle adding a new share
  const handleAddShare = () => {
    if (!recipient.trim()) {
      toast({
        title: "Missing email",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format
    if (!isValidEmail(recipient.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    addShareMutation.mutate({ email: recipient.trim(), permission });
  };
  
  // Function to handle generating/updating a share link
  const handleGenerateLink = () => {
    linkShareMutation.mutate({ permission: linkPermission, isPublic: isPublicLink });
  };
  
  // Function to generate and copy share link
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/prototype/${prototypeId}?share=${linkId}`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
    
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };
  
  // Function to validate email format
  const isValidEmail = (email: string): boolean => {
    const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
  };
  
  // Function to handle deleting a share
  const handleDeleteShare = (shareId: string) => {
    deleteShareMutation.mutate(shareId);
  };
  
  // Reset copy state when dialog closes
  useEffect(() => {
    if (!open) {
      setLinkCopied(false);
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share "{prototypeName}"</DialogTitle>
          <DialogDescription>
            Share this prototype with others via link or email
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as "link" | "email")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span>Share link</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Email invite</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="public-link" className="flex-1">Anyone with the link</Label>
                  <Switch 
                    id="public-link"
                    checked={isPublicLink} 
                    onCheckedChange={setIsPublicLink} 
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {isPublicLink 
                    ? "The prototype will be accessible to anyone with the link, even without an account" 
                    : "Only users with an account who are logged in can access the prototype"}
                </div>
              </div>
              
              <Select
                value={linkPermission}
                onValueChange={(value) => setLinkPermission(value as Permission)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Can view</SelectItem>
                  <SelectItem value="comment">Can comment</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGenerateLink}
              >
                {linkId ? "Update link" : "Generate link"}
              </Button>
              
              {linkId && (
                <div className="flex items-center gap-2 mt-4">
                  <Input
                    value={`${window.location.origin}/prototype/${prototypeId}?share=${linkId}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button 
                    size="icon"
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={permission}
                  onValueChange={(value) => setPermission(value as Permission)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Permission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can view</SelectItem>
                    <SelectItem value="comment">Can comment</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleAddShare}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send invitation
              </Button>
              
              {shares.length > 0 && (
                <div className="mt-4">
                  <Separator className="my-4" />
                  <h3 className="text-sm font-medium mb-2">Shared with</h3>
                  <div className="space-y-2">
                    {shares.map((share: any) => (
                      <div key={share.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {share.shared_by?.avatar_url ? (
                              <AvatarImage src={share.shared_by.avatar_url} alt={share.shared_by?.name || ""} />
                            ) : (
                              <AvatarFallback>{share.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{share.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {share.permission === "view" && "Can view"}
                              {share.permission === "comment" && "Can comment"}
                              {share.permission === "edit" && "Can edit"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteShare(share.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
