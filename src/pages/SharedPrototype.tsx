
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PrototypePreview } from '@/components/prototype-preview';
import { Skeleton } from '@/components/ui/skeleton';
import NotFound from './NotFound';

export default function SharedPrototype() {
  const { id } = useParams<{ id: string }>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  // Check if the prototype is publicly accessible
  const { data: prototype, isLoading, error } = useQuery({
    queryKey: ['shared-prototype', id],
    queryFn: async () => {
      if (!id) return null;

      try {
        // First check if prototype exists and is shared publicly
        const { data: shares, error: sharesError } = await supabase
          .from('prototype_shares')
          .select('*')
          .eq('prototype_id', id)
          .eq('is_link_share', true)
          .eq('is_public', true)
          .single();
        
        if (sharesError) {
          console.error('Error checking prototype access:', sharesError);
          setHasAccess(false);
          return null;
        }
        
        if (shares) {
          setHasAccess(true);
          
          // If it's public, get prototype details
          const { data: prototypeData, error: prototypeError } = await supabase
            .from('prototypes')
            .select('*')
            .eq('id', id)
            .single();
            
          if (prototypeError) {
            console.error('Error fetching prototype:', prototypeError);
            return null;
          }
          
          // Update access timestamp
          await supabase
            .from('prototype_shares')
            .update({ accessed_at: new Date().toISOString() })
            .eq('id', shares.id);
            
          return prototypeData;
        } else {
          setHasAccess(false);
          return null;
        }
      } catch (error) {
        console.error('Error in shared prototype query:', error);
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

  if (!prototype || hasAccess === false) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Prototype Not Available</h1>
        <p className="text-muted-foreground mb-6">
          This prototype either doesn't exist or is not publicly shared.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{prototype.name || 'Shared Prototype'}</h1>
      <PrototypePreview prototypeId={id || ''} className="border rounded-lg" />
    </div>
  );
}
