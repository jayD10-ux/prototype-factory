
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageSquare, Smartphone, Tablet, Monitor, Share2, Download, RefreshCw } from 'lucide-react';
import { Tabs } from '@/components/Tabs';
import { Button } from '@/components/ui/button';
import { FeedbackOverlay } from './feedback/FeedbackOverlay';
import { useSupabase } from '@/lib/supabase-provider';
import { useToast } from '@/hooks/use-toast';
import { ShareDialog } from './prototype/sharing/ShareDialog';
import '@/styles/PreviewIframe.css';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface PreviewWindowProps {
  deploymentId?: string;
  prototypeId: string;
  url?: string;
  onShare?: () => void;
}

export function PreviewWindow({ deploymentId, prototypeId, url, onShare }: PreviewWindowProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filesUrl, setFilesUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [prototypeName, setPrototypeName] = useState<string>('Prototype');
  const [activeTab, setActiveTab] = useState('preview');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scale, setScale] = useState(1);
  const [feedbackPoints, setFeedbackPoints] = useState<any[]>([]);
  const [feedbackUsers, setFeedbackUsers] = useState<Record<string, any>>({});
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { user } = useSupabase();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Get prototype info and URL
  useEffect(() => {
    const getPreviewUrl = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (url) {
          // If a direct URL is provided, use it
          setPreviewUrl(url);
          setIsLoading(false);
          return;
        }

        if (!prototypeId) {
          console.error("No prototypeId or URL provided to PreviewWindow");
          setLoadError("No prototype information provided");
          setIsLoading(false);
          return;
        }

        // Get prototype data
        const { data: prototypeData, error: prototypeError } = await supabase
          .from('prototypes')
          .select('name, deployment_url, file_path')
          .eq('id', prototypeId)
          .single();

        if (prototypeError) {
          throw prototypeError;
        }

        if (prototypeData) {
          setPrototypeName(prototypeData.name || 'Prototype');

          if (prototypeData.deployment_url) {
            setPreviewUrl(prototypeData.deployment_url);
          } else if (prototypeData.file_path) {
            // Get file URL from storage
            const { data } = await supabase.storage
              .from('prototype-uploads')
              .getPublicUrl(prototypeData.file_path);

            if (data && data.publicUrl) {
              setPreviewUrl(data.publicUrl);
              setFilesUrl(data.publicUrl);
            }
          } else if (deploymentId) {
            // Get URL from storage using deploymentId
            const { data } = await supabase.storage
              .from('prototype-deployments')
              .getPublicUrl(`${deploymentId}/index.html`);

            if (data && data.publicUrl) {
              setPreviewUrl(data.publicUrl);
            }
          } else {
            setLoadError("No preview available for this prototype");
          }
        } else {
          setLoadError("Could not find prototype information");
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading preview:", error);
        setLoadError("Error loading preview");
        setIsLoading(false);
      }
    };

    getPreviewUrl();

    // Clean up on unmount
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
    };
  }, [deploymentId, prototypeId, url]);

  // Fetch feedback data if in feedback mode
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
      const points = feedbacks.map((feedback: any) => {
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
      });

      setFeedbackPoints(points);
      setFeedbackUsers(users);
    } catch (error: any) {
      console.error('Error fetching feedback:', error);
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
      console.error('Error adding feedback:', error);
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
      console.error('Error updating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive"
      });
    }
  };

  const toggleFeedbackMode = useCallback(() => {
    setIsFeedbackMode(prev => !prev);
    setActiveTab('preview');
  }, []);

  const handleDownload = () => {
    if (filesUrl) {
      window.open(filesUrl, '_blank');
      toast({
        title: "Download Started",
        description: "Your files will download in a new tab"
      });
    } else {
      toast({
        title: "No Files Available",
        description: "There are no files available to download for this prototype",
        variant: "destructive"
      });
    }
  };

  const handleShareClick = () => {
    setShowShareDialog(true);
  };

  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      // Force iframe reload
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl;
        }
      }, 100);
    }
  };

  // Device size styles
  const deviceStyles = {
    mobile: { width: '375px', height: '667px' },
    tablet: { width: '768px', height: '1024px' },
    desktop: { width: '100%', height: '100%' }
  };

  const currentStyles = deviceStyles[deviceType];
  const rotatedStyles = orientation === 'landscape' && deviceType !== 'desktop'
    ? { width: currentStyles.height, height: currentStyles.width }
    : currentStyles;

  const originalDimensions = {
    width: parseInt(currentStyles.width) || window.innerWidth,
    height: parseInt(currentStyles.height) || window.innerHeight
  };

  // Prepare tabs content
  const tabs = [
    {
      id: 'preview',
      label: 'Preview',
      content: (
        <div className="relative flex-1 h-full">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* Device controls */}
            <div className="flex items-center bg-background/80 backdrop-blur-sm rounded-md border p-1">
              <Button
                variant={deviceType === 'mobile' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setDeviceType('mobile')}
                className="h-8 w-8"
                title="Mobile view"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                variant={deviceType === 'tablet' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setDeviceType('tablet')}
                className="h-8 w-8"
                title="Tablet view"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={deviceType === 'desktop' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setDeviceType('desktop')}
                className="h-8 w-8"
                title="Desktop view"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center bg-background/80 backdrop-blur-sm rounded-md border p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="h-8 w-8"
                title="Refresh preview"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {filesUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="h-8 w-8"
                  title="Download prototype files"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShareClick}
                className="h-8 w-8"
                title="Share prototype"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant={isFeedbackMode ? 'default' : 'ghost'}
                size="icon"
                onClick={toggleFeedbackMode}
                className="h-8 w-8"
                title={isFeedbackMode ? "Disable feedback mode" : "Enable feedback mode"}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center h-full">
            <div 
              style={{
                ...rotatedStyles,
                transform: `scale(${scale})`,
                transformOrigin: 'center',
                position: 'relative',
                transition: 'width 0.3s, height 0.3s, transform 0.3s'
              }}
              className="bg-white shadow-lg overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : loadError ? (
                <div className="flex items-center justify-center h-full p-4 text-center">
                  <div>
                    <p className="text-destructive font-medium mb-2">{loadError}</p>
                    <p className="text-sm text-muted-foreground">Please check if the prototype has been deployed correctly.</p>
                  </div>
                </div>
              ) : (
                <>
                  <iframe
                    ref={iframeRef}
                    src={previewUrl || 'about:blank'}
                    className="w-full h-full border-0 preview-iframe"
                    sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
                    loading="lazy"
                    title="Prototype Preview"
                  />

                  {isFeedbackMode && (
                    <FeedbackOverlay
                      prototypeId={prototypeId}
                      isFeedbackMode={isFeedbackMode}
                      feedbackPoints={feedbackPoints}
                      onFeedbackAdded={handleFeedbackAdded}
                      onFeedbackUpdated={handleFeedbackUpdated}
                      feedbackUsers={feedbackUsers}
                      currentUser={user ? {
                        id: user.id,
                        name: user.user_metadata?.name || user.email,
                        avatar_url: user.user_metadata?.avatar_url
                      } : undefined}
                      deviceType={deviceType}
                      orientation={orientation}
                      scale={scale}
                      originalDimensions={originalDimensions}
                      onClose={() => setIsFeedbackMode(false)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'feedback',
      label: 'Feedback',
      content: (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Feedback & Comments</h2>
          {feedbackPoints.length > 0 ? (
            <div className="grid gap-4">
              {feedbackPoints.map(feedback => (
                <div key={feedback.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{feedback.content}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Status: {feedback.status.replace('_', ' ')}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsFeedbackMode(true);
                        setActiveTab('preview');
                        // Ideally would also select this feedback point
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No feedback available</p>
              <Button 
                onClick={() => {
                  setIsFeedbackMode(true);
                  setActiveTab('preview');
                }}
                className="mt-4"
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
