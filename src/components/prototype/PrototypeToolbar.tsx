
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List, Plus, Share, Trash } from "lucide-react";

interface PrototypeToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (value: "grid" | "list") => void;
  onAddPrototype: () => void;
  selectionMode: boolean;
  selectedCount: number;
  onSelectAll: () => void;
  onAddToCollection: () => void;
  onDeleteSelected: () => void;
  hideSelectionControls?: boolean;
  hideAddButton?: boolean;
}

export function PrototypeToolbar({ 
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onAddPrototype,
  selectionMode,
  selectedCount,
  onSelectAll,
  onAddToCollection,
  onDeleteSelected,
  hideSelectionControls = false,
  hideAddButton = false
}: PrototypeToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search prototypes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={sortBy}
          onValueChange={onSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (value) onViewModeChange(value as "grid" | "list");
          }}
          className="hidden md:flex"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2">
        {selectionMode && !hideSelectionControls && (
          <>
            <Button variant="outline" onClick={onSelectAll}>
              Select All
            </Button>
            <Button variant="outline" onClick={onAddToCollection}>
              <Share className="mr-2 h-4 w-4" />
              Add to Collection
            </Button>
            <Button variant="destructive" onClick={onDeleteSelected}>
              <Trash className="mr-2 h-4 w-4" />
              Delete {selectedCount > 0 ? `(${selectedCount})` : ""}
            </Button>
          </>
        )}
        
        {!hideAddButton && (
          <Button onClick={onAddPrototype}>
            <Plus className="mr-2 h-4 w-4" />
            New Prototype
          </Button>
        )}
      </div>
    </div>
  );
}
