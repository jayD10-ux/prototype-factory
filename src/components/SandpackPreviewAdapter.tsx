
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
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
  const { user, isSignedIn } = useUser();
  const [feedbackUser, setFeedbackUser] = useState<FeedbackUser | null>(null);

  useEffect(() => {
    if (user && isSignedIn) {
      // Convert Clerk user to FeedbackUser type
      const feedbackUserData: FeedbackUser = {
        id: user.id,
        name: user.fullName || "Anonymous",
        avatar_url: user.imageUrl || "",
      };
      setFeedbackUser(feedbackUserData);
    } else {
      setFeedbackUser(null);
    }
  }, [user, isSignedIn]);

  return (
    <SandpackPreview />
  );
};
