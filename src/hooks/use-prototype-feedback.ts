// Update imports to use both Supabase and Clerk
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase-provider";
import { useClerkAuth } from "@/lib/clerk-provider";
import { useToast } from "@/hooks/use-toast";
import { notifyNewComment, notifyCommentReply, notifyCommentResolved } from "@/utils/notification-utils";

export function usePrototypeFeedback(prototypeId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackEnabled, setIsFeedbackEnabled] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  
  const { supabase } = useSupabase();
  const { user } = useClerkAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentUserId = user?.id;

  const enableFeedback = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("prototypes")
        .update({ feedback_enabled: true })
        .eq("id", prototypeId);

      if (error) throw error;

      setIsFeedbackEnabled(true);
      toast({
        title: "Feedback Enabled",
        description: "Feedback is now enabled for this prototype",
      });
    } catch (error: any) {
      console.error("Error enabling feedback:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to enable feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [supabase, prototypeId, toast]);

  const disableFeedback = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("prototypes")
        .update({ feedback_enabled: false })
        .eq("id", prototypeId);

      if (error) throw error;

      setIsFeedbackEnabled(false);
      toast({
        title: "Feedback Disabled",
        description: "Feedback is now disabled for this prototype",
      });
    } catch (error: any) {
      console.error("Error disabling feedback:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [supabase, prototypeId, toast]);
  
  // Example of how to update all the methods that used supabaseAuthWrapper.getSession() previously:
  const addFeedback = useCallback(async (feedbackData: any) => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add comments",
        variant: "destructive",
      });
      return null;
    }

    setIsSubmitting(true);

    try {
      const { data: prototype, error: prototypeError } = await supabase
        .from("prototypes")
        .select("created_by, name")
        .eq("id", prototypeId)
        .single();

      if (prototypeError) throw prototypeError;

      const { data, error } = await supabase
        .from("prototype_feedback")
        .insert({
          ...feedbackData,
          prototype_id: prototypeId,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify prototype owner if the commenter is not the owner
      if (prototype.created_by !== currentUserId) {
        await notifyNewComment(
          prototype.created_by,
          currentUserId,
          prototypeId,
          prototype.name,
          data.id,
          feedbackData.content
        );
      }

      queryClient.invalidateQueries({ queryKey: ["prototype-feedback"] });
      toast({
        title: "Feedback Added",
        description: "Your feedback has been added successfully",
      });

      return data;
    } catch (error: any) {
      console.error("Error adding feedback:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add feedback",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [supabase, prototypeId, currentUserId, toast, queryClient]);

  const addReply = useCallback(
    async (commentId: string, replyContent: string) => {
      if (!currentUserId) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add replies",
          variant: "destructive",
        });
        return null;
      }

      setIsSubmitting(true);

      try {
        const { data: comment, error: commentError } = await supabase
          .from("prototype_feedback")
          .select("created_by, prototype_id")
          .eq("id", commentId)
          .single();

        if (commentError) throw commentError;

        const { data: prototype, error: prototypeError } = await supabase
          .from("prototypes")
          .select("name")
          .eq("id", comment.prototype_id)
          .single();

        if (prototypeError) throw prototypeError;

        const { data, error } = await supabase
          .from("prototype_feedback_replies")
          .insert({
            comment_id: commentId,
            content: replyContent,
            created_by: currentUserId,
          })
          .select()
          .single();

        if (error) throw error;

        // Notify comment owner if the replier is not the owner
        if (comment.created_by !== currentUserId) {
          await notifyCommentReply(
            comment.created_by,
            currentUserId,
            prototypeId,
            prototype.name,
            commentId,
            replyContent
          );
        }

        queryClient.invalidateQueries({ queryKey: ["prototype-feedback"] });
        toast({
          title: "Reply Added",
          description: "Your reply has been added successfully",
        });

        return data;
      } catch (error: any) {
        console.error("Error adding reply:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to add reply",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [supabase, currentUserId, toast, queryClient, prototypeId]
  );

  const resolveFeedback = useCallback(
    async (commentId: string) => {
      if (!currentUserId) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to resolve feedback",
          variant: "destructive",
        });
        return false;
      }

      setIsSubmitting(true);

      try {
        const { data: comment, error: commentError } = await supabase
          .from("prototype_feedback")
          .select("created_by, prototype_id")
          .eq("id", commentId)
          .single();

        if (commentError) throw commentError;

        const { data: prototype, error: prototypeError } = await supabase
          .from("prototypes")
          .select("name")
          .eq("id", comment.prototype_id)
          .single();

        if (prototypeError) throw prototypeError;

        const { error } = await supabase
          .from("prototype_feedback")
          .update({ resolved: true, resolved_by: currentUserId })
          .eq("id", commentId);

        if (error) throw error;

        // Notify comment owner if the resolver is not the owner
        if (comment.created_by !== currentUserId) {
          await notifyCommentResolved(
            comment.created_by,
            currentUserId,
            prototypeId,
            prototype.name,
            commentId
          );
        }

        queryClient.invalidateQueries({ queryKey: ["prototype-feedback"] });
        toast({
          title: "Feedback Resolved",
          description: "Feedback has been resolved successfully",
        });

        return true;
      } catch (error: any) {
        console.error("Error resolving feedback:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to resolve feedback",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [supabase, currentUserId, toast, queryClient, prototypeId]
  );

  const unresolveFeedback = useCallback(
    async (commentId: string) => {
      setIsSubmitting(true);

      try {
        const { error } = await supabase
          .from("prototype_feedback")
          .update({ resolved: false, resolved_by: null })
          .eq("id", commentId);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ["prototype-feedback"] });
        toast({
          title: "Feedback Unresolved",
          description: "Feedback has been unresolved successfully",
        });

        return true;
      } catch (error: any) {
        console.error("Error unresolving feedback:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to unresolve feedback",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [supabase, toast, queryClient]
  );

  const deleteFeedback = useCallback(
    async (commentId: string) => {
      setIsSubmitting(true);

      try {
        const { error } = await supabase
          .from("prototype_feedback")
          .delete()
          .eq("id", commentId);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ["prototype-feedback"] });
        toast({
          title: "Feedback Deleted",
          description: "Feedback has been deleted successfully",
        });

        return true;
      } catch (error: any) {
        console.error("Error deleting feedback:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete feedback",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [supabase, toast, queryClient]
  );

  return {
    isSubmitting,
    isFeedbackEnabled,
    setIsFeedbackEnabled,
    selectedFeedback,
    setSelectedFeedback,
    enableFeedback,
    disableFeedback,
    addFeedback,
    addReply,
    resolveFeedback,
    unresolveFeedback,
    deleteFeedback,
  };
}
