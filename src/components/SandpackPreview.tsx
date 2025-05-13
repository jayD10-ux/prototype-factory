
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { PreviewControls } from './preview/PreviewControls';
import { FeedbackOverlay } from './feedback/FeedbackOverlay';
import { cn } from '@/lib/utils';
import '@/styles/sandpack-fix.css';
import '@/styles/PreviewIframe.css';
import { FeedbackPoint } from '@/types/feedback';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '@/lib/supabase-provider';

interface SandpackPreviewProps {
  files: string | Record<string, string>;  // Can now accept either a string URL or files object
  mainFile: string; // Path to the main HTML file in the ZIP
  prototypeId?: string;
  onShare?: () => void;
  onDownload?: () => void;
  isFeedbackMode?: boolean;
  onToggleFeedbackMode?: () => void;
  externalResourcesUrl?: string; // Added to handle external URLs
}

type ViewMode = 'preview' | 'code' | 'split' | 'design';
type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function SandpackPreview({ 
  files, 
  mainFile, 
  prototypeId, 
  onShare, 
  onDownload,
  isFeedbackMode = false,
  onToggleFeedbackMode,
  externalResourcesUrl
}: SandpackPreviewProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  // Instead of initializing as false, use the prop
  const [isFeedbackModeActive, setIsFeedbackModeActive] = useState(isFeedbackMode);
  const [showUI, setShowUI] = useState(true);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scale, setScale] = useState(1);
  const [feedbackPoints, setFeedbackPoints] = useState<FeedbackPoint[]>([]);
  const [feedbackUsers, setFeedbackUsers] = useState<Record<string, any>>({});
  const { user } = useSupabase();

  // Update local state when prop changes
  useEffect(() => {
    setIsFeedbackModeActive(isFeedbackMode);
  }, [isFeedbackMode]);

  useEffect(() => {
    if (prototypeId) {
      fetchFeedbackPoints();
    }
  }, [prototypeId]);

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
      toast.error('Failed to load feedback points');
    }
  };

  const handleFeedbackAdded = async (feedback: FeedbackPoint) => {
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

      const newFeedback: FeedbackPoint = {
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

      toast.success('Feedback added successfully');
    } catch (error: any) {
      console.error('Error adding feedback:', error);
      toast.error('Failed to add feedback');
    }
  };

  const handleFeedbackUpdated = async (feedback: FeedbackPoint) => {
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

      toast.success('Feedback updated successfully');
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    }
  };

  // Handle toggle feedback mode
  const handleToggleFeedback = () => {
    const newState = !isFeedbackModeActive;
    setIsFeedbackModeActive(newState);
    if (onToggleFeedbackMode) {
      onToggleFeedbackMode();
    }
  };

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        setError(null);

        // If external resources URL is provided, use that directly
        if (externalResourcesUrl) {
          setContent(externalResourcesUrl);
          setIsLoading(false);
          return;
        }
        
        // Check if files is a string URL
        if (typeof files === 'string') {
          setContent(files);
          setIsLoading(false);
          return;
        }
        
        // If it's an object, process it as files
        if (typeof files === 'object' && Object.keys(files).length > 0) {
          // Process files logic would go here
          console.log("Processing files object:", files);
          setContent("about:blank"); // Placeholder
          setIsLoading(false);
          return;
        }

        // No valid content
        throw new Error("No valid files or external URL provided");
      } catch (err: any) {
        console.error('Error loading preview:', err);
        setError(err.message || 'Failed to load preview');
        toast.error('Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();

    // Cleanup
    return () => {
      if (content) {
        URL.revokeObjectURL(content);
      }
    };
  }, [files, mainFile, externalResourcesUrl]);

  const handleRefresh = () => {
    if (content) {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        iframe.src = content;
      }
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleDeviceChange = (device: DeviceType) => {
    setDeviceType(device);
  };

  const handleOrientationChange = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  const deviceStyles = {
    mobile: { width: '375px', height: '667px' },
    tablet: { width: '768px', height: '1024px' },
    desktop: { width: '100%', height: '100%' }
  };

  const currentStyles = deviceStyles[deviceType];
  const rotatedStyles = orientation === 'landscape' && deviceType !== 'desktop'
    ? { width: currentStyles.height, height: currentStyles.width }
    : currentStyles;

  return (
    <div className="flex flex-col h-full">
      {showUI && (
        <PreviewControls
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isFeedbackMode={isFeedbackModeActive}
          onToggleFeedbackMode={handleToggleFeedback}
          showUI={showUI}
          onToggleUI={() => setShowUI(prev => !prev)}
          deviceType={deviceType}
          orientation={orientation}
          onDeviceChange={handleDeviceChange}
          onOrientationChange={handleOrientationChange}
          scale={scale}
          onScaleChange={setScale}
          onRefresh={handleRefresh}
          onShare={onShare}
          onDownload={onDownload}
          filesUrl={typeof files === 'string' ? files : ''}
        />
      )}

      <div className="flex-1 relative overflow-hidden">
        <div 
          className={cn(
            "transition-all duration-300 absolute inset-0 flex items-center justify-center",
            !showUI && "p-0"
          )}
        >
          <div 
            style={{
              ...rotatedStyles,
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              transition: 'transform 0.3s ease'
            }}
            className="bg-white relative shadow-lg overflow-hidden preview-iframe"
          >
            <iframe
              src={content}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
              allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
              loading="lazy"
            />
          </div>
        </div>

        {isFeedbackModeActive && prototypeId && (
          <FeedbackOverlay
            prototypeId={prototypeId}
            isFeedbackMode={isFeedbackModeActive}
            deviceType={deviceType}
            orientation={orientation}
            scale={scale}
            originalDimensions={{
              width: deviceType === 'mobile' ? 375 : deviceType === 'tablet' ? 768 : window.innerWidth,
              height: deviceType === 'mobile' ? 667 : deviceType === 'tablet' ? 1024 : window.innerHeight
            }}
            onClose={() => setIsFeedbackModeActive(false)}
            feedbackPoints={feedbackPoints}
            onFeedbackAdded={handleFeedbackAdded}
            onFeedbackUpdated={handleFeedbackUpdated}
            feedbackUsers={feedbackUsers}
            currentUser={user ? {
              id: user.id,
              name: user.user_metadata?.name || user.email,
              avatar_url: user.user_metadata?.avatar_url
            } : undefined}
          />
        )}
      </div>
    </div>
  );
}
