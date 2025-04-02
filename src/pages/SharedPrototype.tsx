
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PrototypePreview } from '@/components/prototype-preview';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import NotFound from './NotFound';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

export default function SharedPrototype() {
  const { id } = useParams<{ id: string }>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);
  const { toast } = useToast();
  
  console.log('SharedPrototype - Prototype ID from URL:', id);

  useEffect(() => {
    // Check if the user is authenticated
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setIsAnonymous(!data.session);
    };
    
    checkSession();
  }, []);
  
  const userEmail = session?.user?.email;
  
  // Check if the prototype is accessible
  const { data: prototype, isLoading, error } = useQuery({
    queryKey: ['shared-prototype', id, userEmail],
    queryFn: async () => {
      if (!id) {
        console.error('SharedPrototype - No ID provided in URL');
        return null;
      }

      try {
        console.log('SharedPrototype - Checking prototype access for ID:', id);
        
        // First check if prototype exists at all
        const { data: prototypeExists, error: prototypeExistsError } = await supabase
          .from('prototypes')
          .select('id')
          .eq('id', id)
          .single();
          
        if (prototypeExistsError) {
          console.error('SharedPrototype - Prototype does not exist:', prototypeExistsError);
          setHasAccess(false);
          return null;
        }
        
        console.log('SharedPrototype - Prototype exists:', !!prototypeExists);
        
        let hasShareAccess = false;
        let shareRecord = null;
        
        try {
          // Check for public link share access first - this works for anonymous users
          const { data: publicShare, error: publicShareError } = await supabase
            .from('prototype_shares')
            .select('*')
            .eq('prototype_id', id)
            .eq('is_link_share', true)
            .eq('is_public', true)
            .maybeSingle();
          
          if (publicShareError) {
            console.error('SharedPrototype - Error checking public share access:', publicShareError);
          } else if (publicShare) {
            console.log('SharedPrototype - Public share record found');
            hasShareAccess = true;
            shareRecord = publicShare;
            console.log('SharedPrototype - Access granted via public link share');
          }
        } catch (e) {
          console.error('SharedPrototype - Error in public share check:', e);
          // Continue to email check even if this fails
        }
        
        // If no public share and user is logged in, check for email-based share
        if (!hasShareAccess && userEmail) {
          try {
            console.log('SharedPrototype - Checking email-based share for:', userEmail);
            
            const { data: emailShare, error: emailShareError } = await supabase
              .from('prototype_shares')
              .select('*')
              .eq('prototype_id', id)
              .eq('email', userEmail)
              .maybeSingle();
            
            if (emailShareError) {
              console.error('SharedPrototype - Error checking email share:', emailShareError);
            } else if (emailShare) {
              console.log('SharedPrototype - Email share record found');
              hasShareAccess = true;
              shareRecord = emailShare;
              console.log('SharedPrototype - Access granted via email share');
            }
          } catch (e) {
            console.error('SharedPrototype - Error in email share check:', e);
          }
        }

        // Check if user is the prototype owner (they should always have access)
        if (!hasShareAccess && session?.user?.id) {
          try {
            const { data: ownedPrototype, error: ownedError } = await supabase
              .from('prototypes')
              .select('id')
              .eq('id', id)
              .eq('created_by', session.user.id)
              .maybeSingle();
            
            if (!ownedError && ownedPrototype) {
              console.log('SharedPrototype - User is prototype owner');
              hasShareAccess = true;
            }
          } catch (e) {
            console.error('SharedPrototype - Error checking prototype ownership:', e);
          }
        }
        
        // If access is granted through any sharing method
        if (hasShareAccess) {
          setHasAccess(true);
          
          // Get prototype details
          const { data: prototypeData, error: prototypeError } = await supabase
            .from('prototypes')
            .select(`
              *,
              profiles:created_by(name, avatar_url)
            `)
            .eq('id', id)
            .single();
            
          if (prototypeError) {
            console.error('SharedPrototype - Error fetching prototype details:', prototypeError);
            return null;
          }
          
          console.log('SharedPrototype - Prototype data retrieved successfully');
          
          // Update access timestamp if we have a share record
          if (shareRecord?.id) {
            try {
              await supabase
                .from('prototype_shares')
                .update({ accessed_at: new Date().toISOString() })
                .eq('id', shareRecord.id);
            } catch (e) {
              console.error('Error updating access timestamp:', e);
              // Non-critical error, continue anyway
            }
          }
          
          // Transform the data to include creator information
          const result = {
            ...prototypeData,
            creator_name: prototypeData.profiles?.name || 'Unknown User',
            creator_avatar: prototypeData.profiles?.avatar_url,
            profiles: undefined // Remove the nested profiles object
          };
          
          return result;
        } else {
          console.log('SharedPrototype - No share access found for this prototype');
          setHasAccess(false);
          return null;
        }
      } catch (error) {
        console.error('SharedPrototype - Error in shared prototype query:', error);
        setHasAccess(false);
        return null;
      }
    },
    enabled: !!id,
    retry: 1, // Limit retries to avoid overwhelming the server on errors
    refetchOnWindowFocus: false,
  });

  const handleSignIn = () => {
    window.location.href = '/auth';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    console.error('SharedPrototype - Query error:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading this prototype. Please try again later.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!prototype || hasAccess === false) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Prototype Not Available</h1>
        <p className="text-muted-foreground mb-6">
          This prototype either doesn't exist or is not shared with you.
        </p>
        {session ? (
          <p className="text-sm text-muted-foreground">
            If you believe you should have access, please contact the prototype owner.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You may need to sign in to access this prototype.
            </p>
            <Button onClick={handleSignIn}>Sign In</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{prototype.name || 'Shared Prototype'}</h1>
          {prototype.creator_name && (
            <p className="text-muted-foreground">Created by {prototype.creator_name}</p>
          )}
        </div>
        
        {isAnonymous && (
          <Card className="p-4 bg-muted/50 mt-4 md:mt-0">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-sm text-muted-foreground">You're viewing as a guest</p>
              <Button onClick={handleSignIn} variant="outline" size="sm">
                <User className="mr-2 h-4 w-4" />
                Sign In for Full Access
              </Button>
            </div>
          </Card>
        )}
      </div>
      
      <PrototypePreview prototypeId={id || ''} className="border rounded-lg" />
      
      {isAnonymous && (
        <div className="mt-6 p-4 border border-dashed rounded-lg">
          <h3 className="text-lg font-medium mb-2">Want more?</h3>
          <p className="text-muted-foreground mb-4">Sign in to access additional features:</p>
          <ul className="list-disc pl-5 mb-4 text-sm text-muted-foreground space-y-1">
            <li>Download prototype files</li>
            <li>Add feedback and comments</li>
            <li>Create your own prototypes</li>
            <li>Collaborate with team members</li>
          </ul>
          <Button onClick={handleSignIn}>
            Sign In or Create Account
          </Button>
        </div>
      )}
    </div>
  );
}
