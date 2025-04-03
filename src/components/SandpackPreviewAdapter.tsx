
import { useState, useEffect } from "react";
import { SandpackPreview } from "./SandpackPreview";
import { useClerkAuth } from "@/lib/clerk-provider";
import { FeedbackUser } from "@/types/feedback";

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
  const { user, isAuthenticated } = useClerkAuth();
  const [feedbackUser, setFeedbackUser] = useState<FeedbackUser | null>(null);

  useEffect(() => {
    if (user) {
      // Convert user to FeedbackUser type (making sure we follow the expected structure)
      const feedbackUserData: FeedbackUser = {
        id: user.id,
        name: user.user_metadata?.name || "Anonymous",
        avatar_url: user.user_metadata?.avatar_url || "",
      };
      setFeedbackUser(feedbackUserData);
    } else {
      setFeedbackUser(null);
    }
  }, [user]);

  return (
    <SandpackPreview
      prototypeId={prototypeId}
      files={files}
      activeFile={activeFile}
      readOnly={readOnly}
      feedbackUser={feedbackUser}
      enableFeedback={enableFeedback && isAuthenticated}
      showFeedback={showFeedback}
      onRuntimeError={onRuntimeError}
      iframeSrc={iframeSrc}
      autorun={autorun}
    />
  );
};
