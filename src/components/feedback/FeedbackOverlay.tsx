
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FeedbackPoint as FeedbackPointType, FeedbackUser } from '@/types/feedback';
import { FeedbackPoint } from './FeedbackPoint';
import { CommentThread } from './CommentThread';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIframeStability } from '@/hooks/use-iframe-stability';

interface FeedbackOverlayProps {
  prototypeId: string;
  isFeedbackMode: boolean;
  feedbackPoints: FeedbackPointType[];
  onFeedbackAdded: (feedback: FeedbackPointType) => void;
  onFeedbackUpdated: (feedback: FeedbackPointType) => void;
  feedbackUsers: Record<string, FeedbackUser>;
  currentUser?: FeedbackUser;
  previewContainerRef?: React.RefObject<HTMLDivElement>;
  deviceType?: 'desktop' | 'tablet' | 'mobile' | 'custom';
  orientation?: 'portrait' | 'landscape';
  scale?: number;
}

export function FeedbackOverlay({
  prototypeId,
  isFeedbackMode,
  feedbackPoints,
  onFeedbackAdded,
  onFeedbackUpdated,
  feedbackUsers,
  currentUser,
  previewContainerRef,
  deviceType = 'desktop',
  orientation = 'portrait',
  scale = 1
}: FeedbackOverlayProps) {
  const { toast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [newFeedbackPosition, setNewFeedbackPosition] = useState<{ x: number, y: number } | null>(null);
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackPointType | null>(null);
  const [isInteractingWithComment, setIsInteractingWithComment] = useState(false);
  
  // Use the custom hook for iframe stability
  const { isIframeReady, refreshCheck } = useIframeStability({
    containerSelector: '.sp-preview',
    readyCheckInterval: 150,
    maxRetries: 40
  });

  // Refresh iframe check when feedback mode changes
  useEffect(() => {
    if (isFeedbackMode) {
      refreshCheck();
    }
  }, [isFeedbackMode, refreshCheck]);

  // Use memoized handler for overlay clicks to prevent unnecessary recreations
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFeedbackMode || !overlayRef.current || !isIframeReady) return;
    
    // If we're already interacting with a comment, don't add a new one
    if (isInteractingWithComment) {
      e.stopPropagation();
      return;
    }
    
    // Check if we clicked on an existing feedback point or form
    if ((e.target as HTMLElement).closest('.feedback-point') || 
        (e.target as HTMLElement).closest('.feedback-form') ||
        (e.target as HTMLElement).closest('.comment-thread')) {
      e.stopPropagation();
      return;
    }
    
    try {
      const rect = overlayRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        setNewFeedbackPosition({ x, y });
        setSelectedFeedback(null);
        e.stopPropagation();
      }
    } catch (error) {
      console.error('Error handling overlay click:', error);
    }
  }, [isFeedbackMode, isIframeReady, isInteractingWithComment]);

  // Memoized handlers for feedback interactions
  const handleFeedbackPointClick = useCallback((feedback: FeedbackPointType) => {
    setIsInteractingWithComment(true);
    setSelectedFeedback(feedback);
    setNewFeedbackPosition(null);
  }, []);

  const handleCancelNewFeedback = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setNewFeedbackPosition(null);
    setNewFeedbackContent('');
    
    setTimeout(() => setIsInteractingWithComment(false), 100);
  }, []);

  const handleSubmitNewFeedback = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!newFeedbackPosition || !newFeedbackContent.trim() || !currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add a comment and make sure you're logged in."
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('prototype_feedback')
        .insert({
          prototype_id: prototypeId,
          created_by: currentUser.id,
          content: newFeedbackContent,
          position: newFeedbackPosition,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onFeedbackAdded(data as FeedbackPointType);
        toast({
          title: "Feedback added",
          description: "Your feedback has been added to the prototype."
        });
      }
      
      setNewFeedbackPosition(null);
      setNewFeedbackContent('');
      
      setTimeout(() => setIsInteractingWithComment(false), 100);
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add feedback. Please try again."
      });
      setIsInteractingWithComment(false);
    }
  }, [newFeedbackPosition, newFeedbackContent, currentUser, prototypeId, onFeedbackAdded, toast]);

  const handleUpdateFeedbackStatus = useCallback(async (status: FeedbackPointType['status'], e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!selectedFeedback || !currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('prototype_feedback')
        .update({ status })
        .eq('id', selectedFeedback.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onFeedbackUpdated(data as FeedbackPointType);
        setSelectedFeedback(data as FeedbackPointType);
        toast({
          title: "Status updated",
          description: `Feedback status changed to ${status}.`
        });
      }
    } catch (error) {
      console.error("Error updating feedback status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status. Please try again."
      });
    }
  }, [selectedFeedback, currentUser, onFeedbackUpdated, toast]);

  const handleAddReply = useCallback((content: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    toast({
      title: "Reply added",
      description: "Your reply has been added to the feedback."
    });
  }, [toast]);
  
  const handleCloseCommentThread = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setSelectedFeedback(null);
    
    setTimeout(() => setIsInteractingWithComment(false), 100);
  }, []);

  if (!isFeedbackMode) {
    return null;
  }

  return (
    <div 
      ref={overlayRef}
      className={`absolute inset-0 ${isIframeReady ? 'cursor-crosshair' : 'cursor-wait'} ${isFeedbackMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onClick={handleOverlayClick}
    >
      {!isIframeReady && isFeedbackMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30 z-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {isIframeReady && feedbackPoints.map(feedback => (
        <div 
          key={feedback.id} 
          className="feedback-point"
          onClick={(e) => e.stopPropagation()} 
        >
          <FeedbackPoint
            feedback={feedback}
            onClick={handleFeedbackPointClick}
            isSelected={selectedFeedback?.id === feedback.id}
            commentCount={0} 
          />
        </div>
      ))}
      
      {isIframeReady && selectedFeedback && (
        <div 
          className="absolute comment-thread z-40"
          style={{
            left: `${selectedFeedback.position.x}%`,
            top: `${selectedFeedback.position.y}%`,
            transform: 'translate(10px, -50%)'
          }}
          onClick={(e) => e.stopPropagation()} 
        >
          <CommentThread
            feedback={selectedFeedback}
            onClose={handleCloseCommentThread}
            onUpdateStatus={handleUpdateFeedbackStatus}
            onAddReply={handleAddReply}
            currentUser={currentUser}
            creator={feedbackUsers[selectedFeedback.created_by]}
          />
        </div>
      )}
      
      {isIframeReady && newFeedbackPosition && (
        <div 
          className="absolute feedback-form z-40"
          style={{
            left: `${newFeedbackPosition.x}%`,
            top: `${newFeedbackPosition.y}%`,
            transform: 'translate(10px, -50%)'
          }}
          onClick={(e) => e.stopPropagation()} 
        >
          <Card className="w-72">
            <CardContent className="p-3">
              <Textarea
                placeholder="What's your feedback?"
                value={newFeedbackContent}
                onChange={(e) => setNewFeedbackContent(e.target.value)}
                className="min-h-[80px]"
                autoFocus
                onClick={(e) => e.stopPropagation()} 
              />
            </CardContent>
            <CardFooter className="p-3 pt-0 flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelNewFeedback}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubmitNewFeedback}
                disabled={!newFeedbackContent.trim()}
              >
                Submit
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
