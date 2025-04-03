
/// <reference types="vite/client" />

// Declare the showErrorToast function on the window object
interface Window {
  showErrorToast?: (message: string) => void;
  menuitemfn?: (id: string) => void;
}
