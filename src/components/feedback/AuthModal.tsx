
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/lib/clerk-provider";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export function AuthModal({ isOpen, onClose, redirectPath }: AuthModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useClerkAuth();

  // If user is already authenticated, just close the modal
  React.useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  const handleLogin = () => {
    // Store the current URL or custom path to redirect back after login
    const redirectTo = redirectPath || window.location.pathname;
    localStorage.setItem('redirectAfterLogin', redirectTo);
    navigate('/sign-in');
    onClose();
  };

  const handleContinueAsGuest = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to leave feedback on prototypes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Sign in to your account to leave feedback and collaborate on prototypes.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleContinueAsGuest} className="sm:w-auto w-full">
            Continue as Guest
          </Button>
          <Button onClick={handleLogin} className="sm:w-auto w-full">
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
