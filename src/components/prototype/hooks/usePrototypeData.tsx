import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Prototype } from "@/types/prototype";
import { useSupabase } from "@/lib/supabase-provider";
import { PrototypeShare } from "@/types/prototype-sharing";

export function usePrototypeData(
  sortBy: string,
  searchTerm: string,
  collectionId: string | null,
  sharedWithMe: boolean = false
) {
  const { session } = useSupabase();
  const { toast } = useToast();
  const userId = session?.user?.id;

  // Query for prototype data
  const {
    data: prototypes = [],
    isLoading: isPrototypesLoading,
    error: prototypesError,
  } = useQuery<Prototype[]>({
    queryKey: ["prototypes", sortBy, searchTerm, collectionId, sharedWithMe, userId],
    queryFn: async () => {
      try {
        if (!userId) return [];

        if (sharedWithMe) {
          // Get prototypes that have been shared with the user
          const { data: sharedPrototypeIds, error: sharedError } = await supabase
            .from('prototype_shares' as any)
            .select("prototype_id")
            .eq("email", session?.user?.email)
            .eq("is_link_share", false);
            
          if (sharedError) throw sharedError;
          
          // If no prototypes have been shared with the user, return empty array
          if (!sharedPrototypeIds || sharedPrototypeIds.length === 0) {
            return [];
          }
          
          // Fixed: Using double type assertion to avoid TypeScript errors
          const typedSharedPrototypeIds = sharedPrototypeIds as unknown as { prototype_id: string }[];
          
          // Get the actual prototypes
          const { data: sharedPrototypes, error: prototypesError } = await supabase
            .from("prototypes")
            .select(`
              *,
              profiles:created_by(name, avatar_url)
            `)
            .in(
              "id", 
              typedSharedPrototypeIds.map(item => item.prototype_id)
            );
            
          if (prototypesError) throw prototypesError;
          
          // Transform the data to include creator information
          return (sharedPrototypes || []).map((prototype: any) => {
            const profile = prototype.profiles || {};
            return {
              ...prototype,
              creator_name: profile.name || 'Unknown User',
              creator_avatar: profile.avatar_url,
              profiles: undefined // Remove the nested profiles object
            };
          }) as Prototype[];
        } else {
          // Get the user's own prototypes
          let query = supabase
            .from("prototypes")
            .select(`
              *,
              profiles:created_by(name, avatar_url)
            `)
            .eq('created_by', userId);

          // Apply collection filter if a collection is selected
          if (collectionId) {
            const { data: prototypeIds } = await supabase
              .from("prototype_collections")
              .select("prototype_id")
              .eq("collection_id", collectionId);

            if (prototypeIds && prototypeIds.length > 0) {
              query = query.in(
                "id",
                prototypeIds.map((item) => item.prototype_id)
              );
            } else {
              // No prototypes in this collection
              return [];
            }
          }

          // Apply search filter
          if (searchTerm) {
            query = query.ilike("name", `%${searchTerm}%`);
          }

          // Apply sorting
          switch (sortBy) {
            case "recent":
              query = query.order("created_at", { ascending: false });
              break;
            case "oldest":
              query = query.order("created_at", { ascending: true });
              break;
            case "name":
              query = query.order("name", { ascending: true });
              break;
            default:
              query = query.order("created_at", { ascending: false });
          }

          const { data, error } = await query;

          if (error) throw error;

          // Transform the data to include creator information
          return (data || []).map((prototype: any) => {
            const profile = prototype.profiles || {};
            return {
              ...prototype,
              creator_name: profile.name || 'Unknown User',
              creator_avatar: profile.avatar_url,
              profiles: undefined // Remove the nested profiles object
            };
          }) as Prototype[];
        }
      } catch (error) {
        console.error("Error fetching prototypes:", error);
        toast({
          title: "Error",
          description: "Failed to fetch prototypes",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!userId,
  });

  // Query for prototype collection associations
  const { data: prototypeCollections = [] } = useQuery({
    queryKey: ["prototype-collections"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("prototype_collections")
          .select("*");

        if (error) throw error;

        return data || [];
      } catch (error) {
        console.error("Error fetching prototype collections:", error);
        return [];
      }
    },
  });

  return {
    prototypes,
    prototypeCollections,
    isLoading: isPrototypesLoading,
    error: prototypesError,
  };
}
