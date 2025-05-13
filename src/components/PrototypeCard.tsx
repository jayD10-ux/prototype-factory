
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from './ui/badge';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { PrototypePreview } from './PrototypePreview';
import { supabase } from '@/integrations/supabase/client';

// Define a simpler Prototype type to match what we need
interface Prototype {
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
}

interface PrototypeCardProps {
  prototype: Prototype;
  onDeleteSuccess?: () => void;
  feedbackMode?: boolean;
}

export function PrototypeCard({ 
  prototype, 
  onDeleteSuccess,
  feedbackMode = false
}: PrototypeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleEdit = () => {
    // Simplified edit handler
    console.log("Edit prototype:", prototype.id);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('prototypes')
        .delete()
        .eq('id', prototype.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Prototype deleted successfully.",
      });
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete prototype.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video overflow-hidden">
        <div className="absolute top-2 left-2 z-10">
          {prototype.status === 'draft' && (
            <Badge variant="secondary">Draft</Badge>
          )}
          {prototype.is_public && (
            <Badge variant="default">Public</Badge>
          )}
        </div>
        
        {prototype.deployment_url && (
          <div className="absolute inset-0">
            <PrototypePreview 
              deploymentUrl={prototype.deployment_url} 
              className="h-full"
              filesUrl={prototype.bundle_path}
              sandboxConfig={prototype.sandbox_config}
              originalDimensions={{
                width: prototype.device_width || 1920,
                height: prototype.device_height || 1080
              }}
              feedbackMode={feedbackMode}
            />
          </div>
        )}
        
        {!prototype.deployment_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">No preview available</span>
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex items-center">
          {prototype.icon ? (
            <Avatar className="mr-3 h-8 w-8">
              <AvatarImage src={prototype.icon} alt={prototype.name} />
              <AvatarFallback>{prototype.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="mr-3 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-secondary-foreground font-semibold">{prototype.name.substring(0, 1)}</span>
            </div>
          )}
          <CardTitle className="text-lg font-semibold truncate">{prototype.name}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="text-sm text-muted-foreground line-clamp-3">
          {prototype.description || 'No description'}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          {/* Device type indicator would go here if needed */}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Delete Prototype</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete "{prototype.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
