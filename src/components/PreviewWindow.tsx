
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShareDialog } from './prototype/sharing/ShareDialog';
import '@/styles/PreviewIframe.css';
import { SandpackPreview } from './SandpackPreview';
import { Tabs } from '@/components/Tabs';
import { FeedbackPoint } from '@/types/feedback';
import { useSupabase } from '@/lib/supabase-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface PreviewWindowProps {
  url?: string | null;
  onShare?: () => void;
  prototypeId: string;
}

export function PreviewWindow({ prototypeId, url, onShare }: PreviewWindowProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [filesUrl, setFilesUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useSandpack, setUseSandpack] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [prototypeName, setPrototypeName] = useState<string>('Prototype');
  const [mainFile, setMainFile] = useState<string>('index.html');
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [feedbackPoints, setFeedbackPoints] = useState<FeedbackPoint[]>([]);
  const [feedbackUsers, setFeedbackUsers] = useState<Record<string, any>>({});
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useIsMobile();
  const { user } = useSupabase();
  const { toast } = useToast();
  
  const fetchPrototypeUrl = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // If url is provided, use it directly
      if (url) {
        console.log("[PreviewWindow] Using provided URL:", url);
        setPreviewUrl(url);
        setIsLoading(false);
        return;
      }

      console.log("[PreviewWindow] No direct URL provided, fetching prototype:", prototypeId);

      // Get prototype details
      const { data: prototype, error: prototypeError } = await supabase
        .from('prototypes')
        .select('name, file_path, deployment_status, deployment_url, preview_url, url')
        .eq('id', prototypeId)
        .single();

      if (prototypeError) {
        console.error("[PreviewWindow] Error fetching prototype:", prototypeError);
        throw prototypeError;
      }

      if (!prototype) {
        console.error('[PreviewWindow] Error fetching prototype: no data');
        setLoadError("Failed to load prototype");
        setIsLoading(false);
        return;
      }

      console.log("[PreviewWindow] Prototype data:", prototype);
      setPrototypeName(prototype.name);
      setMainFile('index.html'); // Default to index.html since we don't have main_file column yet

      // Determine the best URL to use
      if (prototype.deployment_url) {
        console.log("[PreviewWindow] Using deployment URL:", prototype.deployment_url);
        setPreviewUrl(prototype.deployment_url);
        setIsLoading(false);
      } else if (prototype.preview_url) {
        console.log("[PreviewWindow] Using preview URL:", prototype.preview_url);
        setPreviewUrl(prototype.preview_url);
        setIsLoading(false);
      } else if (prototype.url) {
        console.log("[PreviewWindow] Using regular URL:", prototype.url);
        setPreviewUrl(prototype.url);
        setIsLoading(false);
      } else if (prototype.file_path) {
        console.log("[PreviewWindow] Using file path:", prototype.file_path);
        const { data } = await supabase
          .storage
          .from('prototype-uploads')
          .getPublicUrl(prototype.file_path);

        console.log("[PreviewWindow] Generated public URL:", data.publicUrl);
        setFilesUrl(data.publicUrl);

        if (prototype.file_path.endsWith('.zip')) {
          // We'll use SandpackPreview for ZIP files
          console.log("[PreviewWindow] Detected ZIP file, using SandpackPreview");
          setUseSandpack(true);
        } else {
          // For direct HTML files, we can use the URL directly
          console.log("[PreviewWindow] Using direct file URL for preview");
          setPreviewUrl(data.publicUrl);
        }
        
        setIsLoading(false);
      } else {
        console.log("[PreviewWindow] No preview options available");
        setLoadError("No preview available");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("[PreviewWindow] Error loading preview:", error);
      setLoadError("Failed to load preview");
      setIsLoading(false);
    }
  }, [prototypeId, url]);

  // Fetch feedback data when in feedback mode
  useEffect(() => {
    if (isFeedbackMode && prototypeId) {
      fetchFeedbackPoints();
    }
  }, [isFeedbackMode, prototypeId]);

  const fetchFeedbackPoints = async () => {
    try {
      const { data: feedbacks, error } = await supabase
        .from('comments')
        .select('*, profiles:created_by(*)')
        .eq('prototype_id', prototypeId);

      if (error) throw error;

      const users: Record<string, any> = {};
      const points = feedbacks?.map((feedback: any) => {
        users[feedback.created_by] = feedback.profiles;
        return {
          id: feedback.id,
          prototype_id: feedback.prototype_id,
          position: feedback.position,
          content: feedback.content,
          created_by: feedback.created_by,
          created_at: feedback.created_at,
          updated_at: feedback.updated_at,
          status: feedback.status || 'open',
          element_target: feedback.element_target || {
            selector: feedback.element_selector,
            xpath: feedback.element_xpath,
            metadata: feedback.element_metadata
          },
          device_info: feedback.device_info || {
            type: feedback.device_type || 'desktop',
            width: window.innerWidth,
            height: window.innerHeight,
            orientation: 'portrait'
          }
        };
      }) || [];

      setFeedbackPoints(points);
      setFeedbackUsers(users);
    } catch (error: any) {
      console.error('[PreviewWindow] Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback points",
        variant: "destructive"
      });
    }
  };

  const handleFeedbackAdded = async (feedback: any) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            prototype_id: prototypeId,
            content: feedback.content,
            position: feedback.position,
            created_by: user?.id,
            status: feedback.status,
            device_info: feedback.device_info,
            element_target: feedback.element_target
          }
        ])
        .select('*, profiles:created_by(*)')
        .single();

      if (error) throw error;

      const newFeedback = {
        ...feedback,
        id: data.id,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: null,
        prototype_id: prototypeId
      };

      setFeedbackPoints(prev => [...prev, newFeedback]);
      setFeedbackUsers(prev => ({
        ...prev,
        [data.created_by]: data.profiles
      }));

      toast({
        title: "Success",
        description: "Feedback added successfully"
      });
    } catch (error: any) {
      console.error('[PreviewWindow] Error adding feedback:', error);
      toast({
        title: "Error",
        description: "Failed to add feedback",
        variant: "destructive"
      });
    }
  };

  const handleFeedbackUpdated = async (feedback: any) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: feedback.content,
          status: feedback.status,
          position: feedback.position,
          device_info: feedback.device_info,
          element_target: feedback.element_target
        })
        .eq('id', feedback.id);

      if (error) throw error;

      setFeedbackPoints(prev =>
        prev.map(f => (f.id === feedback.id ? feedback : f))
      );

      toast({
        title: "Success",
        description: "Feedback updated successfully"
      });
    } catch (error: any) {
      console.error('[PreviewWindow] Error updating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive"
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    fetchPrototypeUrl();

    return () => {
      if (iframeRef.current) {
        // Clean up any iframe resources
        iframeRef.current.src = 'about:blank';
      }
    };
  }, [fetchPrototypeUrl]);

  // Handle share button click - now opens our share dialog
  const handleShare = useCallback(() => {
    setShowShareDialog(true);
  }, []);

  // Toggle feedback mode
  const toggleFeedbackMode = useCallback(() => {
    setIsFeedbackMode(prev => !prev);
    setActiveTab('preview');
  }, []);

  // Prepare tabs content
  const tabs = [
    {
      id: 'preview',
      label: 'Preview',
      content: (
        <div className="h-full w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-destructive">{loadError}</p>
              </div>
            </div>
          ) : useSandpack ? (
            <SandpackPreview 
              files={filesUrl || ''}
              mainFile={mainFile}
              prototypeId={prototypeId}
              onShare={handleShare}
              onDownload={() => {
                if (filesUrl) {
                  window.open(filesUrl, '_blank');
                }
              }}
              isFeedbackMode={isFeedbackMode}
              onToggleFeedbackMode={toggleFeedbackMode}
            />
          ) : previewUrl ? (
            <iframe 
              ref={iframeRef}
              src={previewUrl} 
              className={`w-full h-full border-0 preview-iframe ${isMobile ? 'mobile-preview' : ''}`}
              title="Preview"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
              allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6 max-w-md">
                <h3 className="text-lg font-medium mb-2">No preview available</h3>
                <p className="text-muted-foreground">
                  There is no URL available to preview this prototype.
                </p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'feedback',
      label: 'Feedback',
      content: (
        <div className="p-4 overflow-y-auto h-full">
          <h2 className="text-xl font-semibold mb-4">Feedback & Comments</h2>
          
          {feedbackPoints.length > 0 ? (
            <div className="grid gap-4">
              {feedbackPoints.map(feedback => {
                const user = feedbackUsers[feedback.created_by];
                const userName = user?.name || 'Anonymous';
                
                return (
                  <div key={feedback.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary h-7 w-7 rounded-full flex items-center justify-center text-primary-foreground font-medium">
                          {userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 text-xs rounded-full bg-muted">
                        {feedback.status}
                      </div>
                    </div>
                    <p className="mt-2">{feedback.content}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No feedback available</p>
              <Button 
                onClick={() => {
                  setIsFeedbackMode(true);
                  setActiveTab('preview');
                }}
              >
                Add Feedback
              </Button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="h-full" />
      
      <ShareDialog 
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        prototypeId={prototypeId}
        prototypeName={prototypeName}
      />
    </>
  );
}
