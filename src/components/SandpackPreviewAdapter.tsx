
import React from 'react';
import { usePrototypeFeedback, PrototypeFeedback } from '@/hooks/use-prototype-feedback';
import { User } from '@/types/supabase';

// This adapter maps our feedback hook to the expected interface for SandpackPreview
export function useFeedbackAdapter(prototypeId: string, currentUser?: User | null) {
  const feedback = usePrototypeFeedback(prototypeId);
  
  // Convert our feedback items to the format expected by SandpackPreview
  const feedbackPoints = React.useMemo(() => {
    return feedback.feedbackItems || [];
  }, [feedback.feedbackItems]);
  
  // Map functions to the expected interface
  const addFeedbackPoint = async (data: any) => {
    return await feedback.addFeedback(data);
  };
  
  const updateFeedbackPoint = async (id: string, content: string) => {
    return await feedback.updateFeedback(id, content);
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
