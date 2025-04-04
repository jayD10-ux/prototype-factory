
// This wrapper now uses Clerk instead of Supabase Auth
// It maintains a similar interface for backward compatibility during migration
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

const supabaseAuthWrapper = {
  // These methods now throw errors as they should no longer be used
  // The app should be updated to use Clerk's authentication methods directly
  
  async getSession() {
    console.warn("⚠️ supabaseAuthWrapper.getSession() is deprecated. Use Clerk's useAuth() hook instead.");
    throw new Error("Supabase Auth is no longer used. Please use Clerk for authentication.");
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
