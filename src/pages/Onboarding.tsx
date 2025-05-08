
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
import { useSupabase } from "@/lib/supabase-provider";
import { ProfileUpdateForm } from "@/components/profile/profile-update-form";

export default function Onboarding() {
  const { supabase, user, isLoaded } = useSupabase();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkProfileCompletion = async () => {
      // Wait for Supabase to initialize
      if (!isLoaded) {
        return;
      }

      if (!isAuthenticated || !user) {
        navigate('/');
        return;
      }

      try {
        const userId = user?.id;
        
        if (!userId) {
          throw new Error("No user ID available");
        }
        
        console.log("Checking profile for user ID:", userId);
        
        // Try to find profile using user id
        const { data, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .maybeSingle();
          
        if (error) {
          console.error("Supabase query error:", error);
          throw error;
        }

        if (!data) {
          // Profile doesn't exist, create it
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              name: user.user_metadata.full_name || '',
              avatar_url: user.user_metadata.avatar_url || undefined,
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            throw createError;
          }

          toast({
            title: "Profile created",
            description: "Your profile has been created successfully.",
          });
        } else {
          // Profile exists, update it
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              name: user.user_metadata.full_name || '',
              avatar_url: user.user_metadata.avatar_url || undefined,
            })
            .eq('id', userId)
            .select()
            .single();

          if (updateError) {
            console.error("Error updating profile:", updateError);
            throw updateError;
          }

          toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully.",
          });
        }

        // If we found a profile with a name, it's complete
        if (data?.name) {
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
  }, [isAuthenticated, navigate, toast, isLoaded, supabase, user]);

  // Show a loading state until we know what to do
  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't show anything (navigation happens in useEffect)
  if (!isAuthenticated || !user) {
    return null;
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
