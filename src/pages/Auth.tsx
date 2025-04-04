
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// This is now a simple redirect page to Clerk's auth
export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a redirect path stored
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    
    // Redirect to sign-in
    if (redirectPath) {
      navigate(`/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`, { replace: true });
    } else {
      navigate('/sign-in', { replace: true });
    }
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
