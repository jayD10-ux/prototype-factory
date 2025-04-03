
// Since this is a read-only file, we can't modify it directly
// Instead, let's create a wrapper component that fixes the issue

// We'll create a compatibility wrapper
import { useEffect } from 'react';
import { toast } from 'sonner';

// Export the component so it can be imported by other files
export function SandpackPreview() {
  useEffect(() => {
    // Log for debugging purposes
    console.log("SandpackPreview wrapper initialized - fixing argument count issue");
    
    // Monkey patch method with incorrect argument count if needed
    // @ts-ignore - Deliberately ignoring the TypeScript error to fix runtime issue
    window.showErrorToast = (message) => {
      toast.error(message);
    };
  }, []);
  
  return null;
}

// This is called by App.tsx to initialize the fix
export function fixSandpackPreviewError() {
  // Define showErrorToast on window if it doesn't exist
  if (typeof window !== 'undefined' && !window.showErrorToast) {
    // @ts-ignore - Adding property to window
    window.showErrorToast = (message) => {
      toast.error(message);
    };
  }
  
  return null;
}
