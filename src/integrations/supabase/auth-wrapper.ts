
// This wrapper now uses Clerk instead of Supabase Auth
// It maintains a similar interface for backward compatibility during migration
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";

const supabaseAuthWrapper = {
  // These methods now use Clerk's authentication
  async getSession() {
    // This is a stub to maintain compatibility during migration
    // It returns a simple session-like object with user info from Clerk
    console.warn("⚠️ supabaseAuthWrapper.getSession() is deprecated. Use Clerk's useAuth() or useUser() hook instead.");
    
    // We can't directly use hooks outside of a component
    // This is just a placeholder to prevent runtime errors
    // Components should be updated to use `useSupabase` hook or Clerk hooks directly
    return { 
      data: { 
        session: { 
          user: null 
        } 
      } 
    };
  },

  async signInWithPassword() {
    console.warn("⚠️ supabaseAuthWrapper.signInWithPassword() is deprecated. Use Clerk's signIn() method instead.");
    throw new Error("Supabase Auth is no longer used. Please use Clerk for authentication.");
  },

  async signInWithOAuth() {
    console.warn("⚠️ supabaseAuthWrapper.signInWithOAuth() is deprecated. Use Clerk's OAuth providers instead.");
    throw new Error("Supabase Auth is no longer used. Please use Clerk for authentication.");
  }
};

export default supabaseAuthWrapper;
