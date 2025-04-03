
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProfileUpdateForm } from "@/components/profile/profile-update-form";
import { useClerkAuth } from "@/lib/clerk-provider";

export default function Onboarding() {
  const { user: clerkUser, isAuthenticated } = useClerkAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!isAuthenticated || !clerkUser) {
        navigate('/sign-in');
        return;
      }

      try {
        const clerkId = clerkUser?.id;
        
        if (!clerkId) {
          throw new Error("No user ID available");
        }
        
        console.log("Checking profile for Clerk ID:", clerkId);
        
        // Try to find profile using clerk_id
        const { data, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('clerk_id', clerkId)
          .maybeSingle();
          
        if (error) {
          console.error("Supabase query error:", error);
          throw error;
        }
        
        console.log("Profile data result:", data);
        
        // If we found a profile with a name, it's complete
        if (data?.name) {
          setProfileComplete(true);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
        toast({
          title: "Error",
          description: "Failed to check profile status. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileCompletion();
  }, [clerkUser, isAuthenticated, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide some information to complete your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileUpdateForm onComplete={() => navigate('/dashboard')} />
        </CardContent>
      </Card>
    </div>
  );
}
