
import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import { useToast } from '@/hooks/use-toast';
import { PrototypeShare, ShareFormData, LinkShareOptions } from '@/types/prototype-sharing';

export function usePrototypeSharing(prototypeId: string) {
  const { supabase, clerkId } = useSupabase();
  const { toast } = useToast();
  const [shares, setShares] = useState<PrototypeShare[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [isDeletingShare, setIsDeletingShare] = useState(false);

  // Fetch all shares for this prototype
  const fetchShares = useCallback(async () => {
    if (!prototypeId) return;
    
    setIsLoadingShares(true);
    try {
      const { data, error } = await supabase
        .from('prototype_shares')
        .select('*')
        .eq('prototype_id', prototypeId);
        
      if (error) throw error;
      
      // Cast the data to the correct type
      setShares(data as unknown as PrototypeShare[]);
    } catch (error) {
      console.error('Error fetching prototype shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sharing settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingShares(false);
    }
  }, [prototypeId, supabase, toast]);

  // Get link share (if exists)
  const getLinkShare = useCallback(() => {
    return shares.find(share => share.is_link_share);
  }, [shares]);

  // Get email shares
  const getEmailShares = useCallback(() => {
    return shares.filter(share => !share.is_link_share);
  }, [shares]);

  // Create email share
  const createEmailShare = useCallback(async (shareData: ShareFormData) => {
    setIsCreatingShare(true);
    try {
      // Check if a share for this email already exists
      const existingShare = shares.find(share => 
        !share.is_link_share && share.email === shareData.email
      );
      
      if (existingShare) {
        // Update existing share
        const { error } = await supabase
          .from('prototype_shares')
          .update({ 
            permission: shareData.permission 
          })
          .eq('id', existingShare.id);
          
        if (error) throw error;
        
        toast({
          title: 'Share updated',
          description: `Updated permissions for ${shareData.email}`
        });
        
        await fetchShares();
        return;
      }
      
      // Create new share
      const { data, error } = await supabase
        .from('prototype_shares')
        .insert({
          prototype_id: prototypeId,
          shared_by: clerkId,
          email: shareData.email,
          permission: shareData.permission,
          is_link_share: false,
          is_public: false
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Prototype shared',
        description: `Prototype shared with ${shareData.email}`
      });
      
      await fetchShares();
    } catch (error) {
      console.error('Error creating email share:', error);
      toast({
        title: 'Error',
        description: 'Failed to share prototype',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingShare(false);
    }
  }, [prototypeId, clerkId, shares, supabase, toast, fetchShares]);

  // Update share permission
  const updateSharePermission = useCallback(async (shareId: string, permission: 'view' | 'edit' | 'admin') => {
    setIsUpdatingShare(true);
    try {
      const { error } = await supabase
        .from('prototype_shares')
        .update({ permission })
        .eq('id', shareId);
        
      if (error) throw error;
      
      toast({
        title: 'Permission updated',
        description: 'Share permission has been updated'
      });
      
      await fetchShares();
    } catch (error) {
      console.error('Error updating share permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingShare(false);
    }
  }, [supabase, toast, fetchShares]);

  // Update link share options
  const updateLinkShare = useCallback(async (options: LinkShareOptions) => {
    setIsUpdatingShare(true);
    try {
      // Check if a link share already exists
      const linkShare = getLinkShare();
      
      if (linkShare) {
        // Update existing link share
        const { error } = await supabase
          .from('prototype_shares')
          .update({ 
            is_public: options.is_public,
            permission: options.permission
          })
          .eq('id', linkShare.id);
          
        if (error) throw error;
      } else {
        // Create new link share
        const { error } = await supabase
          .from('prototype_shares')
          .insert({
            prototype_id: prototypeId,
            shared_by: clerkId,
            is_link_share: true,
            is_public: options.is_public,
            permission: options.permission,
            email: null
          });
          
        if (error) throw error;
      }
      
      toast({
        title: 'Link updated',
        description: 'Share link settings have been updated'
      });
      
      await fetchShares();
    } catch (error) {
      console.error('Error updating link share:', error);
      toast({
        title: 'Error',
        description: 'Failed to update link settings',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingShare(false);
    }
  }, [prototypeId, clerkId, supabase, toast, fetchShares, getLinkShare]);

  // Remove a share
  const removeShare = useCallback(async (shareId: string) => {
    setIsDeletingShare(true);
    try {
      const { error } = await supabase
        .from('prototype_shares')
        .delete()
        .eq('id', shareId);
        
      if (error) throw error;
      
      toast({
        title: 'Share removed',
        description: 'Share has been removed'
      });
      
      await fetchShares();
    } catch (error) {
      console.error('Error removing share:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove share',
        variant: 'destructive'
      });
    } finally {
      setIsDeletingShare(false);
    }
  }, [supabase, toast, fetchShares]);

  // Load shares when component mounts
  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

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
