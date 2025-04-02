import { useToast } from "./use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PrototypeShare, ShareFormData, LinkShareOptions } from "@/types/prototype-sharing";

export function usePrototypeSharing(prototypeId: string) {
  const { toast } = useToast();
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [isDeletingShare, setIsDeletingShare] = useState(false);

  // Fetch shares for a prototype
  const {
    data: shares,
    isLoading: isLoadingShares,
    refetch: refetchShares
  } = useQuery({
    queryKey: ['prototype-shares', prototypeId],
    queryFn: async () => {
      // Type assertion to handle typing issue
      const { data, error } = await supabase
        .from('prototype_shares' as any)
        .select('*')
        .eq('prototype_id', prototypeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching prototype shares:", error);
        throw error;
      }

      // Fixed: Using double type assertion to avoid TypeScript errors
      return (data || []) as unknown as PrototypeShare[];
    }
  });

  // Create email share
  const createEmailShare = async (shareData: ShareFormData) => {
    try {
      setIsCreatingShare(true);
      
      // Check if email already has access
      const { data: existingShares } = await supabase
        .from('prototype_shares' as any)
        .select('id')
        .eq('prototype_id', prototypeId)
        .eq('email', shareData.email)
        .eq('is_link_share', false);

      // Fixed: Using double type assertion to avoid TypeScript errors
      const typedExistingShares = existingShares as unknown as { id: string }[] | null;

      if (typedExistingShares && typedExistingShares.length > 0) {
        // Update existing share instead
        const { error } = await supabase
          .from('prototype_shares' as any)
          .update({ permission: shareData.permission })
          .eq('id', typedExistingShares[0].id);

        if (error) throw error;
        
        toast({
          title: "Share updated",
          description: `Updated permissions for ${shareData.email}`
        });
      } else {
        // Create new share
        const { data } = await supabase.auth.getSession();

        const { error } = await supabase
          .from('prototype_shares' as any)
          .insert({
            prototype_id: prototypeId,
            shared_by: data.session?.user.id,
            email: shareData.email,
            permission: shareData.permission,
            is_link_share: false,
            is_public: false
          });

        if (error) throw error;

        toast({
          title: "Share created",
          description: `Shared prototype with ${shareData.email}`
        });
      }

      refetchShares();
    } catch (error) {
      console.error("Error sharing prototype:", error);
      toast({
        variant: "destructive",
        title: "Share failed",
        description: "There was an error sharing this prototype."
      });
    } finally {
      setIsCreatingShare(false);
    }
  };

  // Create or update link share
  const updateLinkShare = async (options: LinkShareOptions) => {
    try {
      setIsUpdatingShare(true);
      
      // Check if link share already exists
      const { data: existingShares } = await supabase
        .from('prototype_shares' as any)
        .select('id')
        .eq('prototype_id', prototypeId)
        .eq('is_link_share', true);

      // Fixed: Using double type assertion to avoid TypeScript errors
      const typedExistingShares = existingShares as unknown as { id: string }[] | null;
      
      const { data } = await supabase.auth.getSession();
      
      if (typedExistingShares && typedExistingShares.length > 0) {
        // Update existing link share
        const { error } = await supabase
          .from('prototype_shares' as any)
          .update({ 
            permission: options.permission,
            is_public: options.is_public,
          })
          .eq('id', typedExistingShares[0].id);

        if (error) throw error;
      } else {
        // Create new link share
        const { error } = await supabase
          .from('prototype_shares' as any)
          .insert({
            prototype_id: prototypeId,
            shared_by: data.session?.user.id,
            is_link_share: true,
            is_public: options.is_public,
            permission: options.permission
          });

        if (error) throw error;
      }
      
      refetchShares();
      
      toast({
        title: "Link share updated",
        description: options.is_public 
          ? "Anyone with the link can now access this prototype" 
          : "Only specific people can access this prototype"
      });
    } catch (error) {
      console.error("Error updating link share:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating the link share."
      });
    } finally {
      setIsUpdatingShare(false);
    }
  };

  // Update share permission
  const updateSharePermission = async (shareId: string, permission: 'view' | 'edit' | 'admin') => {
    try {
      setIsUpdatingShare(true);
      
      const { error } = await supabase
        .from('prototype_shares' as any)
        .update({ permission })
        .eq('id', shareId);

      if (error) throw error;
      
      refetchShares();
      
      toast({
        title: "Permission updated",
        description: `Updated permission to ${permission}`
      });
    } catch (error) {
      console.error("Error updating permission:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating the permission."
      });
    } finally {
      setIsUpdatingShare(false);
    }
  };

  // Remove share
  const removeShare = async (shareId: string) => {
    try {
      setIsDeletingShare(true);
      
      const { error } = await supabase
        .from('prototype_shares' as any)
        .delete()
        .eq('id', shareId);

      if (error) throw error;
      
      refetchShares();
      
      toast({
        title: "Share removed",
        description: "Successfully removed shared access"
      });
    } catch (error) {
      console.error("Error removing share:", error);
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: "There was an error removing the share."
      });
    } finally {
      setIsDeletingShare(false);
    }
  };

  // Get link share
  const getLinkShare = () => {
    if (!shares) return null;
    return shares.find(share => share.is_link_share) || null;
  };

  // Get email shares
  const getEmailShares = () => {
    if (!shares) return [];
    return shares.filter(share => !share.is_link_share);
  };

  return {
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
  };
}
