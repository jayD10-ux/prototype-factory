
import { supabase } from './client';

// This wrapper handles compatibility issues between different versions of Supabase
const supabaseAuthWrapper = {
  async getSession() {
    // Using the current Supabase API version
    return await supabase.auth.getSession();
  },

  async signInWithPassword(credentials: { email: string; password: string }) {
    // Using the current Supabase API version
    return await supabase.auth.signInWithPassword(credentials);
  },

  async signInWithOAuth(params: { provider: string; options?: any }) {
    // Using the current Supabase API version
    return await supabase.auth.signInWithOAuth(params);
  }
};

export default supabaseAuthWrapper;
