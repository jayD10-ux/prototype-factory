import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePrototype } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase-provider";
import { PrototypePreview } from './PrototypePreview';
import { Badge } from './ui/badge';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { useDashboard } from '@/hooks/use-dashboard';
import { usePrototyping } from '@/hooks/use-prototyping';
import { useToastContext } from '@/components/ui/use-toast-context';
import { useFeedback } from '@/hooks/use-feedback';
import { useShare } from '@/hooks/use-share';
import { useDownload } from '@/hooks/use-download';
import { useDeviceType } from '@/hooks/use-device-type';
import { getDeviceIcon } from '@/utils/icons';
import { Prototype } from '@/types';

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
  const { user } = useSupabase();
  const queryClient = useQueryClient();
  const { setPrototypeId } = useDashboard();
  const { setIsEditorOpen } = usePrototyping();
  const { toast } = useToastContext();
  const { confirmDelete } = useFeedback();
  const { handleShare } = useShare();
  const { handleDownload } = useDownload();
  const deviceType = useDeviceType();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { mutate: deleteProto, isLoading: isDeleting } = useMutation(
    () => deletePrototype(prototype.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['prototypes']);
        toast({
          title: "Success",
          description: "Prototype deleted successfully.",
        });
        onDeleteSuccess?.();
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete prototype.",
        });
      },
    }
  );

  const handleEdit = () => {
    setPrototypeId(prototype.id);
    setIsEditorOpen(true);
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
              filesUrl={prototype.bundle_path || undefined}
              onShare={handleShare}
              onDownload={handleDownload}
              sandboxConfig={prototype.sandbox_config as any}
              feedbackMode={feedbackMode}
              originalDimensions={{
                width: prototype.device_width || 1920,
                height: prototype.device_height || 1080
              }}
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
          {prototype.created_by && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getDeviceIcon(deviceType)}
              {deviceType}
            </div>
          )}
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

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          deleteProto();
          setIsDeleteOpen(false);
        }}
        isLoading={isDeleting}
        itemType="prototype"
        itemName={prototype.name}
      />
    </Card>
  );
}
