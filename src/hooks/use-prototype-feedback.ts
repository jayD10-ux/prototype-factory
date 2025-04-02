import { useState } from "react";
import { useToast } from "./use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface PrototypeFeedback {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  content: string;
  prototype_id?: string | null;
  created_by?: string | null;
  element_selector?: string | null;
  element_xpath?: string | null;
  element_metadata?: Json | null;
  device_type?: string | null;
  position?: Json | null;
  status?: string | null;
}

export interface PrototypeReaction {
  id: string;
  created_at?: string | null;
  prototype_id?: string | null;
  feedback_id?: string | null;
  created_by?: string | null;
  reaction_type: string;
}

export function usePrototypeFeedback(prototypeId: string) {
  const { toast } = useToast();
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [isAddingReaction, setIsAddingReaction] = useState(false);
  const [isUpdatingFeedback, setIsUpdatingFeedback] = useState(false);
  const [isResolvingFeedback, setIsResolvingFeedback] = useState(false);

  const {
    data: feedbackItems,
    isLoading: isLoadingFeedback,
    refetch: refetchFeedback
  } = useQuery({
    queryKey: ['prototype-feedback', prototypeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prototype_feedback')
        .select('*')
        .eq('prototype_id', prototypeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching prototype feedback:", error);
        throw error;
      }

      return (data || []) as unknown as PrototypeFeedback[];
    }
  });

  const addFeedback = async (feedbackData: Omit<PrototypeFeedback, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsAddingFeedback(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        toast({
          title: "Error",
          description: "You must be logged in to leave feedback.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('prototype_feedback')
        .insert([
          {
            ...feedbackData,
            prototype_id: prototypeId,
            created_by: userId
          }
        ]);

      if (error) throw error;

      toast({
        title: "Feedback added",
        description: "Your feedback has been submitted."
      });

      refetchFeedback();
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast({
        title: "Error",
        description: "Failed to add feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingFeedback(false);
    }
  };

  const updateFeedback = async (feedbackId: string, content: string) => {
    try {
      setIsUpdatingFeedback(true);
      
      const { error } = await supabase
        .from('prototype_feedback')
        .update({ content })
        .eq('id', feedbackId);

      if (error) throw error;
      
      toast({
        title: "Feedback updated",
        description: "Your feedback has been updated."
      });
      
      refetchFeedback();
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast({
        title: "Error",
        description: "Failed to update feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingFeedback(false);
    }
  };

  const resolveFeedback = async (feedbackId: string) => {
    try {
      setIsResolvingFeedback(true);
      
      const { error } = await supabase
        .from('prototype_feedback')
        .update({ status: 'resolved' })
        .eq('id', feedbackId);

      if (error) throw error;
      
      toast({
        title: "Feedback resolved",
        description: "This feedback has been marked as resolved."
      });
      
      refetchFeedback();
    } catch (error) {
      console.error("Error resolving feedback:", error);
      toast({
        title: "Error",
        description: "Failed to resolve feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResolvingFeedback(false);
    }
  };

  const addReaction = async (feedbackId: string, reactionType: string) => {
    try {
      setIsAddingReaction(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        toast({
          title: "Error",
          description: "You must be logged in to react to feedback.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('prototype_reactions')
        .insert([
          {
            prototype_id: prototypeId,
            feedback_id: feedbackId,
            created_by: userId,
            reaction_type: reactionType
          }
        ]);

      if (error) throw error;

      toast({
        title: "Reaction added",
        description: "Your reaction has been recorded."
      });

      refetchFeedback();
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingReaction(false);
    }
  };

  const removeReaction = async (reactionId: string) => {
    try {
      setIsAddingReaction(true);
      
      const { error } = await supabase
        .from('prototype_reactions')
        .delete()
        .eq('id', reactionId);

      if (error) throw error;

      toast({
        title: "Reaction removed",
        description: "Your reaction has been removed."
      });

      refetchFeedback();
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast({
        title: "Error",
        description: "Failed to remove reaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingReaction(false);
    }
  };

  const getReactions = async (feedbackId: string) => {
    try {
      const { data, error } = await supabase
        .from('prototype_reactions')
        .select('*')
        .eq('feedback_id', feedbackId);

      if (error) throw error;

      return (data || []) as unknown as PrototypeReaction[];
    } catch (error) {
      console.error("Error fetching reactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reactions. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    feedbackItems,
    isLoadingFeedback,
    isAddingFeedback,
    isAddingReaction,
    isUpdatingFeedback,
    isResolvingFeedback,
    addFeedback,
    updateFeedback,
    resolveFeedback,
    addReaction,
    removeReaction,
    getReactions
  };
}
