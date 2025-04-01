
import { useState } from "react";
import { Prototype } from "@/types/prototype";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PrototypeCollectionTag } from "./collection/PrototypeCollectionTag";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

interface PrototypeCardListProps {
  prototypes: Prototype[];
  viewMode: "grid" | "list";
  prototypeCollections: any[];
  selectedPrototypes: string[];
  togglePrototypeSelection: (id: string) => void;
  showCreator?: boolean;
  disableSelection?: boolean;
  collectionId?: string;
}

export function PrototypeCardList({
  prototypes,
  viewMode,
  prototypeCollections,
  selectedPrototypes,
  togglePrototypeSelection,
  showCreator = false,
  disableSelection = false,
  collectionId,
}: PrototypeCardListProps) {
  const navigate = useNavigate();

  const handleClick = (prototype: Prototype) => {
    navigate(`/prototype/${prototype.id}`);
  };

  if (prototypes.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          No prototypes found. Create a new prototype to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${
        viewMode === "grid"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      }`}
    >
      {prototypes.map((prototype) => {
        // Find collections for this prototype
        const prototypeCollectionIds = prototypeCollections
          .filter((pc) => pc.prototype_id === prototype.id)
          .map((pc) => pc.collection_id);

        const isSelected = selectedPrototypes.includes(prototype.id);

        return (
          <Card
            key={prototype.id}
            className={`group relative overflow-hidden transition-shadow hover:shadow-md ${
              isSelected ? "ring-2 ring-primary" : ""
            }`}
          >
            {!disableSelection && (
              <div className="absolute left-2 top-2 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => togglePrototypeSelection(prototype.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div
              className="cursor-pointer"
              onClick={() => handleClick(prototype)}
            >
              <div className="aspect-video overflow-hidden bg-muted">
                {prototype.preview_image ? (
                  <img
                    src={prototype.preview_image}
                    alt={prototype.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <span className="text-muted-foreground">
                      No preview available
                    </span>
                  </div>
                )}
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold leading-none tracking-tight">
                      {prototype.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(prototype.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {showCreator && prototype.creator_name && (
                    <div className="flex items-center space-x-2">
                      <ProfileAvatar 
                        url={prototype.creator_avatar} 
                        size="sm" 
                        editable={false} 
                      />
                      <span className="text-sm text-muted-foreground">
                        {prototype.creator_name}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
            </div>
            
            {prototypeCollectionIds.length > 0 && !collectionId && (
              <CardFooter className="flex flex-wrap gap-2 pt-0">
                {prototypeCollectionIds.map((collectionId) => (
                  <PrototypeCollectionTag
                    key={collectionId}
                    collectionId={collectionId}
                  />
                ))}
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}
