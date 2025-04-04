
import { Badge } from "@/components/ui/badge";
import { Folder } from "lucide-react";
import { CollectionWithCount } from "@/types/prototype";

interface CollectionListProps {
  collections: CollectionWithCount[];
  selectedCollection: string | null;
  onSelectCollection: (collectionId: string | null) => void;
}

export function CollectionList({
  collections,
  selectedCollection,
  onSelectCollection
}: CollectionListProps) {
  if (!collections.length) {
    return null;
  }

  return (
    <>
      {collections.map((collection) => (
        <Badge
          key={collection.id}
          variant={selectedCollection === collection.id ? "default" : "outline"}
          className="cursor-pointer flex items-center"
          style={{ backgroundColor: selectedCollection === collection.id ? collection.color : 'transparent' }}
          onClick={() => onSelectCollection(collection.id)}
        >
          <Folder className="h-3 w-3 mr-1" />
          {collection.name}
          <span className="ml-1 opacity-70 text-xs">
            ({collection.prototypeCount || 0})
          </span>
        </Badge>
      ))}
    </>
  );
}
