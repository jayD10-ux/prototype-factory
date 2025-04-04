
import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase-provider";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export interface Notification {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  seen: boolean;
  cta: {
    type: string;
    data: {
      url: string;
    }
  };
  payload: {
    actorName?: string;
    actorAvatar?: string;
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  comment_replies: boolean;
  comment_resolved: boolean;
  prototype_comments: boolean;
}

export function useNotifications() {
  const { supabase, session } = useSupabase();
  const userId = session?.user?.id;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Fetch notification preferences
  const { data: preferences, refetch: refetchPreferences } = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching notification preferences:", error);
        return null;
      }
      
      return data as NotificationPreferences;
    },
    enabled: !!userId
  });

  // Fetch notifications from Novu
  const fetchNotifications = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke("get-notifications", {
        body: { userId }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to fetch notifications");
      }
      
      if (data?.error) {
        console.error("API error:", data.error, data.details);
        throw new Error(data.error);
      }
      
      if (data?.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.seen).length);
      }
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      setError("Failed to load notifications");
      
      // Only show toast on first failure
      if (retryCount === 0) {
        toast({
          title: "Error fetching notifications",
          description: "Please try again later",
          variant: "destructive"
        });
      }
      
      // Auto retry up to MAX_RETRIES times
      if (retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, nextRetry) * 1000;
        console.log(`Retrying in ${delay}ms (attempt ${nextRetry}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          fetchNotifications();
        }, delay);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    if (!userId) return;
    
    try {
      await supabase.functions.invoke("mark-notification-read", {
        body: { notificationId, userId }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, seen: true } : n)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return;
    
    try {
      await supabase.functions.invoke("mark-all-notifications-read", {
        body: { userId }
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Update notification preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(newPreferences)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Refetch preferences
      refetchPreferences();
      
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated"
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error updating preferences",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Simulate sending a notification (for testing)
  const sendTestNotification = async (recipientUserId: string, type: string) => {
    try {
      await supabase.functions.invoke("send-notification", {
        body: {
          recipientUserId,
          type,
          actorUserId: userId,
          payload: {
            prototypeName: "Test Prototype",
            prototypeId: "test-id",
            commentContent: "This is a test comment"
          }
        }
      });
      
      toast({
        title: "Test notification sent",
        description: "Check your notifications"
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({
        title: "Error sending test notification",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Initialize and refresh notifications
  useEffect(() => {
    if (userId) {
      fetchNotifications();
      
      // Set up a refresh interval
      const intervalId = setInterval(fetchNotifications, 60000); // Refresh every minute
      
      return () => clearInterval(intervalId);
    }
  }, [userId]);

  const retryFetch = () => {
    setRetryCount(0);
    fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    fetchNotifications: retryFetch,
    preferences,
    updatePreferences,
    sendTestNotification
  };
}
