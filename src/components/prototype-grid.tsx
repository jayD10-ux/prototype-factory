import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddPrototypeDialog } from "./add-prototype-dialog";
import { PrototypeCollections } from "./prototype/collection/PrototypeCollections";
import { PrototypeToolbar } from "./prototype/PrototypeToolbar";
import { PrototypeCardList } from "./prototype/PrototypeCardList";
import { AddToCollectionDialog } from "./prototype/collection/AddToCollectionDialog";
import { usePrototypeData } from "./prototype/hooks/usePrototypeData";
import { usePrototypeSelection } from "./prototype/hooks/usePrototypeSelection";
import { Collection, CollectionWithCount } from "@/types/prototype";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAvatar } from "./profile/profile-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabase } from "@/lib/supabase-provider";
import { PrototypeCard } from "./PrototypeCard";

interface PrototypeGridProps {
  feedbackMode?: boolean;
}

// Define a local prototype interface that matches our PrototypeCard component's expectations
interface LocalPrototype {
  id: string;
  name: string;
  description?: string;
  deployment_url?: string;
  bundle_path?: string;
  status?: string;
  is_public?: boolean;
  icon?: string;
  device_width?: number;
  device_height?: number;
  sandbox_config?: {
    permissions: string[];
  };
  created_at?: string;
  created_by?: string;
}

export function PrototypeGrid({ feedbackMode = false }: PrototypeGridProps) {
  // State for view, sort, search and selection
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isAddToCollectionDialogOpen, setIsAddToCollectionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"my" | "shared">("my");
  
  const { supabase } = useSupabase();
  const { user } = useSupabase();
  const { toast } = useToast();

  // Query for collections with counts
  const { data: collections = [] } = useQuery({
    queryKey: ['collections-with-counts'],
    queryFn: async () => {
      try {
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('*')
          .order('name') as { data: Collection[] | null, error: any };

        if (collectionsError) throw collectionsError;
        
        const { data: countsData, error: countsError } = await supabase
          .from('prototype_collections')
          .select('collection_id, prototype_id');
          
        if (countsError) throw countsError;
        
        const countMap: Record<string, number> = {};
        (countsData || []).forEach((item: any) => {
          if (!countMap[item.collection_id]) {
            countMap[item.collection_id] = 0;
          }
          countMap[item.collection_id]++;
        });
        
        return (collectionsData || []).map(collection => ({
          ...collection,
          prototypeCount: countMap[collection.id] || 0
        })) as CollectionWithCount[];
      } catch (error) {
        console.error('Error fetching collections with counts:', error);
        toast({
          title: "Error",
          description: "Failed to fetch collections",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Use our custom hooks for data fetching and selection management
  const { prototypes, prototypeCollections, isLoading } = usePrototypeData(
    sortBy, 
    searchTerm, 
    selectedCollection,
    activeTab === "shared"
  );
  
  const { 
    selectedPrototypes, 
    togglePrototypeSelection, 
    handleSelectAll, 
    handleDeleteSelected 
  } = usePrototypeSelection(prototypes);

  // Handle prototype deletion success
  const handleDeleteSuccess = () => {
    // Refetch prototypes
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: ['prototypes'] });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-40">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
        </div>
      </div>
    );
  }

  // Ensure prototypes have the correct sandbox_config structure
  const normalizedPrototypes = prototypes.map(prototype => {
    // Ensure sandbox_config has permissions property
    const sandbox_config = prototype.sandbox_config ? {
      permissions: Array.isArray(prototype.sandbox_config.permissions) 
        ? prototype.sandbox_config.permissions 
        : ['allow-scripts', 'allow-same-origin']
    } : {
      permissions: ['allow-scripts', 'allow-same-origin']
    };
    
    return {
      ...prototype,
      sandbox_config
    } as LocalPrototype;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs 
        defaultValue="my" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "my" | "shared")}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="my">My Prototypes</TabsTrigger>
          <TabsTrigger value="shared">Shared With Me</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my">
          <PrototypeCollections 
            selectedCollection={selectedCollection}
            onSelectCollection={setSelectedCollection}
            hideHeadline={true}
          />

          <PrototypeToolbar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddPrototype={() => setIsAddDialogOpen(true)}
            selectionMode={selectedPrototypes.length > 0}
            selectedCount={selectedPrototypes.length}
            onSelectAll={handleSelectAll}
            onAddToCollection={() => setIsAddToCollectionDialogOpen(true)}
            onDeleteSelected={handleDeleteSelected}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {normalizedPrototypes.map((prototype) => (
              <PrototypeCard 
                key={prototype.id} 
                prototype={prototype} 
                onDeleteSuccess={handleDeleteSuccess}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="shared">
          {prototypes.length > 0 ? (
            <>
              <PrototypeToolbar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onAddPrototype={() => setIsAddDialogOpen(true)}
                selectionMode={false}
                selectedCount={0}
                onSelectAll={() => {}}
                onAddToCollection={() => {}}
                onDeleteSelected={() => {}}
                hideSelectionControls={true}
                hideAddButton={true}
              />
              
              <PrototypeCardList 
                prototypes={prototypes}
                viewMode={viewMode}
                prototypeCollections={prototypeCollections}
                selectedPrototypes={[]}
                togglePrototypeSelection={() => {}}
                showCreator={true}
                disableSelection={true}
              />
            </>
          ) : (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-center">No Shared Prototypes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Prototypes shared with you will appear here once you open a shared link.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AddToCollectionDialog 
        open={isAddToCollectionDialogOpen}
        onOpenChange={setIsAddToCollectionDialogOpen}
        selectedPrototypes={selectedPrototypes}
        collections={collections}
      />

      <AddPrototypeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
