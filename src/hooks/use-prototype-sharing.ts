import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase-provider";
import { useClerkAuth } from "@/lib/clerk-provider";
import { useToast } from "@/hooks/use-toast";

export function usePrototypeSharing() {
  const [isLoading, setIsLoading] = useState(false);
  const { supabase } = useSupabase();
  const { user } = useClerkAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sharePrototype = useCallback(
    async (prototypeId: string, email: string, permission: "view" | "comment" = "view") => {
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to share prototypes",
          variant: "destructive",
        });
        return null;
      }

      setIsLoading(true);
      try {
        // Check if the prototype exists and the user has permission to share it
        const { data: prototype, error: prototypeError } = await supabase
          .from("prototypes")
          .select("id, name, created_by")
          .eq("id", prototypeId)
          .single();

        if (prototypeError) throw prototypeError;

        // Only the creator can share the prototype
        if (prototype.created_by !== user.id) {
          throw new Error("You don't have permission to share this prototype");
        }

        // Check if this email is already shared with
        const { data: existingShare, error: existingShareError } = await supabase
          .from("prototype_shares")
          .select("id")
          .eq("prototype_id", prototypeId)
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existingShareError) throw existingShareError;

        if (existingShare) {
          // Update existing share
          const { error: updateError } = await supabase
            .from("prototype_shares")
            .update({
              permission,
              accessed_at: null, // Reset accessed_at
            })
            .eq("id", existingShare.id);

          if (updateError) throw updateError;
        } else {
          // Create new share
          const { error: shareError } = await supabase
            .from("prototype_shares")
            .insert({
              prototype_id: prototypeId,
              shared_by: user.id,
              email: email.toLowerCase(),
              permission,
              is_link_share: false,
            });

          if (shareError) throw shareError;
        }

        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({
          queryKey: ["prototype-shares", prototypeId],
        });

        toast({
          title: "Success",
          description: `Prototype shared with ${email}`,
        });

        return true;
      } catch (error: any) {
        console.error("Error sharing prototype:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to share prototype",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user?.id, toast, queryClient]
  );

  const unsharePrototype = useCallback(
    async (prototypeId: string, email: string) => {
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to unshare prototypes",
          variant: "destructive",
        });
        return null;
      }

      setIsLoading(true);
      try {
        // Check if the prototype exists and the user has permission to unshare it
        const { data: prototype, error: prototypeError } = await supabase
          .from("prototypes")
          .select("id, name, created_by")
          .eq("id", prototypeId)
          .single();

        if (prototypeError) throw prototypeError;

        // Only the creator can unshare the prototype
        if (prototype.created_by !== user.id) {
          throw new Error("You don't have permission to unshare this prototype");
        }

        // Delete the share
        const { error: deleteError } = await supabase
          .from("prototype_shares")
          .delete()
          .eq("prototype_id", prototypeId)
          .eq("email", email.toLowerCase());

        if (deleteError) throw deleteError;

        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({
          queryKey: ["prototype-shares", prototypeId],
        });

        toast({
          title: "Success",
          description: `Prototype unshared with ${email}`,
        });

        return true;
      } catch (error: any) {
        console.error("Error unsharing prototype:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to unshare prototype",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user?.id, toast, queryClient]
  );

  const createPublicLink = useCallback(
    async (prototypeId: string, permission: "view" | "comment" = "view") => {
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a public link",
          variant: "destructive",
        });
        return null;
      }

      setIsLoading(true);
      try {
        // Check if the prototype exists and the user has permission to create a public link
        const { data: prototype, error: prototypeError } = await supabase
          .from("prototypes")
          .select("id, name, created_by")
          .eq("id", prototypeId)
          .single();

        if (prototypeError) throw prototypeError;

        // Only the creator can create a public link
        if (prototype.created_by !== user.id) {
          throw new Error("You don't have permission to create a public link for this prototype");
        }

        // Check if a public link already exists
        const { data: existingShare, error: existingShareError } = await supabase
          .from("prototype_shares")
          .select("id, share_id")
          .eq("prototype_id", prototypeId)
          .eq("is_public", true)
          .maybeSingle();

        if (existingShareError) throw existingShareError;

        let shareId;
        if (existingShare) {
          // Update existing share
          const { error: updateError } = await supabase
            .from("prototype_shares")
            .update({
              permission,
              accessed_at: null, // Reset accessed_at
            })
            .eq("id", existingShare.id);

          if (updateError) throw updateError;
          shareId = existingShare.share_id;
        } else {
          // Create new share
          shareId = Math.random().toString(36).substring(2, 15);
          const { error: shareError } = await supabase
            .from("prototype_shares")
            .insert({
              prototype_id: prototypeId,
              shared_by: user.id,
              share_id: shareId,
              permission,
              is_public: true,
              is_link_share: true,
            });

          if (shareError) throw shareError;
        }

        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({
          queryKey: ["prototype-shares", prototypeId],
        });

        toast({
          title: "Success",
          description: "Public link created",
        });

        return shareId;
      } catch (error: any) {
        console.error("Error creating public link:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create public link",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user?.id, toast, queryClient]
  );

  const revokePublicLink = useCallback(
    async (prototypeId: string) => {
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to revoke the public link",
          variant: "destructive",
        });
        return null;
      }

      setIsLoading(true);
      try {
        // Check if the prototype exists and the user has permission to revoke the public link
        const { data: prototype, error: prototypeError } = await supabase
          .from("prototypes")
          .select("id, name, created_by")
          .eq("id", prototypeId)
          .single();

        if (prototypeError) throw prototypeError;

        // Only the creator can revoke the public link
        if (prototype.created_by !== user.id) {
          throw new Error("You don't have permission to revoke the public link for this prototype");
        }

        // Delete the share
        const { error: deleteError } = await supabase
          .from("prototype_shares")
          .delete()
          .eq("prototype_id", prototypeId)
          .eq("is_public", true);

        if (deleteError) throw deleteError;

        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({
          queryKey: ["prototype-shares", prototypeId],
        });

        toast({
          title: "Success",
          description: "Public link revoked",
        });

        return true;
      } catch (error: any) {
        console.error("Error revoking public link:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to revoke public link",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user?.id, toast, queryClient]
  );

  const getPrototypeShares = useCallback(
    async (prototypeId: string) => {
      try {
        const { data, error } = await supabase
          .from("prototype_shares")
          .select("*")
          .eq("prototype_id", prototypeId)
          .not("is_public", "is", true);

        if (error) throw error;

        return data;
      } catch (error: any) {
        console.error("Error fetching prototype shares:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch prototype shares",
          variant: "destructive",
        });
        return [];
      }
    },
    [supabase, toast]
  );

  return {
    isLoading,
    sharePrototype,
    unsharePrototype,
    createPublicLink,
    revokePublicLink,
    getPrototypeShares,
  };
}
