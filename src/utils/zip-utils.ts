
import JSZip from 'jszip';

export async function validatePrototypeZip(file: File) {
  try {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    
    // Check if the ZIP file contains any valid web-related files
    const hasValidFile = Object.keys(content.files).some(filePath => {
      const lowerPath = filePath.toLowerCase();
      
      // Check for web-related files (HTML, JS, CSS, React)
      return (
        lowerPath.endsWith('.html') || 
        lowerPath.endsWith('.htm') || 
        lowerPath.endsWith('.js') || 
        lowerPath.endsWith('.jsx') || 
        lowerPath.endsWith('.tsx') || 
        lowerPath.endsWith('.ts') || 
        lowerPath.endsWith('.css')
      );
    });

    if (!hasValidFile) {
      throw new Error('ZIP file must contain at least one web-related file (HTML, JS, JSX, TSX, CSS)');
    }

    console.log('ZIP file validation passed');
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to validate ZIP file');
  }
}

// Add the unzipToFiles function
export async function unzipToFiles(zipData: Blob): Promise<Record<string, string>> {
  try {
    const zip = new JSZip();
    const content = await zip.loadAsync(zipData);
    const files: Record<string, string> = {};

    const filePromises = Object.keys(content.files).map(async (path) => {
      const file = content.files[path];
      
      // Skip directories
      if (file.dir) {
        return;
      }
      
      try {
        // Get file content as string
        const fileContent = await file.async('string');
        files[path] = fileContent;
      } catch (error) {
        console.warn(`Could not extract file ${path}:`, error);
      }
    });

    await Promise.all(filePromises);
    return files;
  } catch (error) {
    console.error('Error extracting files from zip:', error);
    throw new Error('Failed to extract files from the zip archive');
  }
}
