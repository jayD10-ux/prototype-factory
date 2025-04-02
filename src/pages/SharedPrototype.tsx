
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PrototypePreview } from '@/components/prototype-preview';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase-provider';
import NotFound from './NotFound';

export default function SharedPrototype() {
  const { id } = useParams<{ id: string }>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { session } = useSupabase();
  
  console.log('SharedPrototype - Prototype ID from URL:', id);
  console.log('SharedPrototype - User authenticated:', !!session);

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
        
        // Check for public link share access first
        const { data: publicShare, error: publicShareError } = await supabase
          .from('prototype_shares')
          .select('*')
          .eq('prototype_id', id)
          .eq('is_link_share', true)
          .eq('is_public', true);
        
        if (publicShareError) {
          console.error('SharedPrototype - Error checking public share access:', publicShareError);
        } else {
          console.log('SharedPrototype - Public share records found:', publicShare?.length || 0);
        }
        
        let hasShareAccess = false;
        let shareRecord = null;
        
        // If public share exists
        if (publicShare && publicShare.length > 0) {
          hasShareAccess = true;
          shareRecord = publicShare[0];
          console.log('SharedPrototype - Access granted via public link share');
        } 
        // If user is logged in, check for email-based share
        else if (userEmail) {
          console.log('SharedPrototype - Checking email-based share for:', userEmail);
          
          const { data: emailShare, error: emailShareError } = await supabase
            .from('prototype_shares')
            .select('*')
            .eq('prototype_id', id)
            .eq('email', userEmail);
          
          if (emailShareError) {
            console.error('SharedPrototype - Error checking email share:', emailShareError);
          } else {
            console.log('SharedPrototype - Email share records found:', emailShare?.length || 0);
            
            if (emailShare && emailShare.length > 0) {
              hasShareAccess = true;
              shareRecord = emailShare[0];
              console.log('SharedPrototype - Access granted via email share');
            }
          }
        }
        
        // If access is granted through any sharing method
        if (hasShareAccess && shareRecord) {
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
          
          // Update access timestamp
          if (shareRecord.id) {
            await supabase
              .from('prototype_shares')
              .update({ accessed_at: new Date().toISOString() })
              .eq('id', shareRecord.id);
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
    enabled: !!id
  });

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
          <p className="text-sm text-muted-foreground">
            You may need to sign in to access this prototype.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{prototype.name || 'Shared Prototype'}</h1>
      {prototype.creator_name && (
        <p className="text-muted-foreground mb-4">Created by {prototype.creator_name}</p>
      )}
      <PrototypePreview prototypeId={id || ''} className="border rounded-lg" />
    </div>
  );
}
