
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// This is now a simple redirect page since we're using Clerk's UI components
export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a redirect path stored
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    
    // Since we're now using Clerk, this page should just redirect
    setTimeout(() => {
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }, 500);
    
    setIsLoading(false);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground mx-auto mb-4"></div>
        <p>Redirecting to authentication page...</p>
      </div>
    </div>
  );
}
