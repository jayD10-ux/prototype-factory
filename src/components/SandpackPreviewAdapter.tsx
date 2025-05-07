
import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase-provider";
import { FeedbackUser } from "@/types/feedback";
import { SandpackPreview } from "./SandpackPreview";

interface SandpackPreviewAdapterProps {
  prototypeId: string;
  files: Record<string, string>;
  activeFile?: string;
  readOnly?: boolean;
  enableFeedback?: boolean;
  showFeedback?: boolean;
  onRuntimeError?: (error: Error) => void;
  iframeSrc?: string;
  autorun?: boolean;
}

export const SandpackPreviewAdapter = ({
  prototypeId,
  files,
  activeFile,
  readOnly = true,
  enableFeedback = false,
  showFeedback = false,
  onRuntimeError,
  iframeSrc,
  autorun = true,
}: SandpackPreviewAdapterProps) => {
  const { user, isAuthenticated } = useSupabase();
  const [feedbackUser, setFeedbackUser] = useState<FeedbackUser | null>(null);

  useEffect(() => {
    if (user && isAuthenticated) {
      // Convert Supabase user to FeedbackUser type
      const feedbackUserData: FeedbackUser = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || "Anonymous",
        avatar_url: user.user_metadata?.avatar_url || "",
      };
      setFeedbackUser(feedbackUserData);
    } else {
      setFeedbackUser(null);
    }
  }, [user, isAuthenticated]);

  return (
    <SandpackPreview />
  );
};
