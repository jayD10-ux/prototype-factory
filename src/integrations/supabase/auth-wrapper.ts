
// This is a wrapper for Supabase Auth functions for convenient access
import { supabase } from './client';

const supabaseAuthWrapper = {
  async getSession() {
    return await supabase.auth.getSession();
  },

  async signInWithPassword(credentials: { email: string; password: string }) {
    return await supabase.auth.signInWithPassword(credentials);
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};

export default supabaseAuthWrapper;
