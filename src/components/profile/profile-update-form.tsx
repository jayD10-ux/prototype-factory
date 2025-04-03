
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupabase } from "@/lib/supabase-provider";
import { useClerkAuth } from "@/lib/clerk-provider";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ProfileAvatar } from "./profile-avatar";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  role: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileUpdateFormProps {
  onComplete?: () => void;
}

export function ProfileUpdateForm({ onComplete }: ProfileUpdateFormProps) {
  const { session } = useSupabase();
  const { user: clerkUser } = useClerkAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      role: "",
      bio: "",
    },
  });

  // Get user ID from either Supabase or Clerk
  const supabaseUserId = session?.user?.id;
  const clerkUserId = clerkUser?.id;

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabaseUserId && !clerkUserId) return;
      
      try {
        console.log("Loading profile - Supabase ID:", supabaseUserId, "Clerk ID:", clerkUserId);
        
        let query = supabase.from('profiles').select('*');
        
        if (supabaseUserId) {
          query = query.eq('id', supabaseUserId);
        } else if (clerkUserId) {
          query = query.eq('clerk_id', clerkUserId);
        }
        
        const { data, error } = await query.maybeSingle();
            
        if (error) {
          console.error("Error loading profile:", error);
          throw error;
        }
        
        console.log("Profile data loaded:", data);
        
        if (data) {
          form.reset({
            name: data.name || "",
            role: data.role || "",
            bio: data.bio || "",
          });
          
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    loadProfile();
  }, [supabaseUserId, clerkUserId, form, toast]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!supabaseUserId && !clerkUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Submitting profile - Supabase ID:", supabaseUserId, "Clerk ID:", clerkUserId);
      
      let avatarPath = null;

      // Upload avatar if provided
      if (avatarFile) {
        // Generate unique file path with either ID
        const userId = supabaseUserId || clerkUserId;
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Create storage bucket if it doesn't exist
        const { data: bucketList } = await supabase.storage.listBuckets();
        if (!bucketList?.find(bucket => bucket.name === 'avatars')) {
          await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2 // 2MB
          });
        }

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        // Get public URL for the uploaded avatar
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarPath = data.publicUrl;
      }

      // Prepare profile data
      const profileData: any = {
        name: values.name,
        role: values.role,
        bio: values.bio,
        avatar_url: avatarPath || avatarUrl,
        updated_at: new Date().toISOString(),
      };

      // Handle different user ID types
      if (supabaseUserId) {
        profileData.id = supabaseUserId;
      } else if (clerkUserId) {
        // For Clerk users, we use clerk_id field
        profileData.clerk_id = clerkUserId;
        
        // We also need an id field to satisfy the foreign key constraint
        // The trigger we created will handle the auth.users entry
        if (!supabaseUserId) {
          // Generate a UUID for the Supabase ID
          const { data: uuidData } = await supabase.rpc('gen_random_uuid');
          profileData.id = uuidData;
        }
      }

      console.log("Upserting profile with data:", profileData);

      const { error } = await supabase.from('profiles').upsert(profileData);

      if (error) {
        console.error("Error upserting profile:", error);
        throw error;
      }

      console.log("Profile updated successfully");
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <ProfileAvatar 
            url={avatarUrl} 
            onFileChange={handleAvatarChange} 
          />
          <p className="text-sm text-muted-foreground mt-2">
            Click to upload profile picture
          </p>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name*</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input placeholder="Your role (e.g. Designer, Developer)" {...field} />
              </FormControl>
              <FormDescription>
                Optional: What best describes your job role?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us a bit about yourself" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Optional: A short description about yourself
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </Form>
  );
}
