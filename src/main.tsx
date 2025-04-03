
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx'
import './index.css'

// Initialize Clerk with the publishable key
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_Y2xpbWJpbmctc3R1cmdlb24tMjkuY2xlcmsuYWNjb3VudHMuZGV2JA";

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
