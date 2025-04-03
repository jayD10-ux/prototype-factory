
import React from 'react';
import { usePrototypeFeedback, PrototypeFeedback } from '@/hooks/use-prototype-feedback';
import { User } from '@/types/supabase';
import { FeedbackPoint as FeedbackPointType, FeedbackUser } from '@/types/feedback';

// Define a FeedbackPoint type that's compatible with the one in types/feedback.ts
export interface FeedbackPoint extends Omit<PrototypeFeedback, 'prototype_id' | 'created_by'> {
  prototype_id: string;
  created_by: string;
  // Include all other required fields from the FeedbackPointType
  id: string;
  content: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  created_at: string;
  updated_at: string | null;
  status: string;
}

// Helper function to convert User to FeedbackUser
function userToFeedbackUser(user: User | null): FeedbackUser | null {
  if (!user) return null;
  
  return {
    id: user.id,
    name: user.user_metadata?.name || 'Anonymous',
    email: user.email || null,
    avatar_url: user.user_metadata?.avatar_url || null
  };
}

// This adapter maps our feedback hook to the expected interface for SandpackPreview
export function useFeedbackAdapter(prototypeId: string, currentUser?: User | null) {
  const feedback = usePrototypeFeedback(prototypeId);
  
  // Convert our feedback items to the format expected by SandpackPreview
  const feedbackPoints = React.useMemo(() => {
    return (feedback.feedbackItems || []).map(item => ({
      ...item,
      prototype_id: item.prototype_id || prototypeId, // Ensure prototype_id is always present
      created_by: item.created_by || (currentUser?.id || 'anonymous'), // Ensure created_by is always present
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || null,
      status: item.status || 'open'
    })) as unknown as FeedbackPointType[];
  }, [feedback.feedbackItems, prototypeId, currentUser]);
  
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
  
  // Convert User to FeedbackUser for the feedback component
  const feedbackCurrentUser = currentUser ? userToFeedbackUser(currentUser) : null;
  
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
    currentUser: feedbackCurrentUser,
    addFeedbackPoint,
    updateFeedbackPoint
  };
}
