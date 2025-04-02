
import React from 'react';
import { usePrototypeFeedback, PrototypeFeedback } from '@/hooks/use-prototype-feedback';
import { User } from '@/types/supabase';

// Define a FeedbackPoint type to ensure prototype_id is required
export interface FeedbackPoint extends Omit<PrototypeFeedback, 'prototype_id'> {
  prototype_id: string;
}

// This adapter maps our feedback hook to the expected interface for SandpackPreview
export function useFeedbackAdapter(prototypeId: string, currentUser?: User | null) {
  const feedback = usePrototypeFeedback(prototypeId);
  
  // Convert our feedback items to the format expected by SandpackPreview
  const feedbackPoints = React.useMemo(() => {
    return (feedback.feedbackItems || []).map(item => ({
      ...item,
      prototype_id: item.prototype_id || prototypeId, // Ensure prototype_id is always present
    })) as FeedbackPoint[];
  }, [feedback.feedbackItems, prototypeId]);
  
  // Map functions to the expected interface
  const addFeedbackPoint = async (data: any) => {
    return await feedback.addFeedback(data);
  };
  
  const updateFeedbackPoint = async (updatedFeedback: FeedbackPoint | string, content?: string) => {
    if (typeof updatedFeedback === 'string' && content) {
      // Called as updateFeedbackPoint(id, content)
      return await feedback.updateFeedback(updatedFeedback, content);
    } else if (typeof updatedFeedback === 'object') {
      // Called with a feedback object
      return await feedback.updateFeedback(updatedFeedback.id, updatedFeedback.content);
    }
    return null;
  };
  
  // Mock user data if needed
  const feedbackUsers = React.useMemo(() => {
    // Create mock user data if needed - this would be replaced with real data
    return {};
  }, []);
  
  return {
    ...feedback,
    feedbackPoints,
    isLoading: feedback.isLoadingFeedback,
    feedbackUsers,
    currentUser,
    addFeedbackPoint,
    updateFeedbackPoint
  };
}
