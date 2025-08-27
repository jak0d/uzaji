import { createClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

// These will be set from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url' && supabaseAnonKey !== 'your_supabase_anon_key');
};

// Create Supabase client only if properly configured
export const supabase = isSupabaseConfigured() ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
}) : null;

// Database types
export interface SupabaseTransaction {
  id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  product_id?: string;
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProduct {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseService {
  id: string;
  user_id: string;
  name: string;
  description: string;
  hourly_rate: number;
  category: string;
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseUserSettings {
  id: string;
  user_id: string;
  settings_key: string;
  settings_value: any;
  created_at: string;
  updated_at: string;
}

// Helper functions for Supabase operations
export const supabaseHelpers = {
  // Check if Supabase is configured
  isConfigured: () => {
    return isSupabaseConfigured() && supabase !== null;
  },

  // Get configuration status for debugging
  getConfigStatus: () => {
    return {
      hasUrl: !!supabaseUrl && supabaseUrl !== 'your_supabase_project_url',
      hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key',
      url: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'Not set',
      configured: isSupabaseConfigured()
    };
  },

  // Get current user
  getCurrentUser: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get current session
  getCurrentSession: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.onAuthStateChange(callback);
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, metadata?: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Get the current origin for redirect - ensure it's the correct port
    const currentPort = window.location.port;
    const redirectTo = `${window.location.protocol}//${window.location.hostname}:${currentPort}`;
    
    console.log('Redirecting to:', redirectTo); // Debug log
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    return { data, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
  },

  // Update user metadata
  updateUser: async (attributes: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.updateUser(attributes);
    return { data, error };
  }
};