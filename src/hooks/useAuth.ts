import { useState, useEffect } from 'react';
import { encryption } from '../utils/encryption';
import { supabaseHelpers } from '../utils/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isSupabaseUser?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  googleAuth: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Handle OAuth redirect on page load
    handleOAuthRedirect();
    
    // Listen for auth state changes from Supabase (only if configured)
    if (supabaseHelpers.isConfigured()) {
      try {
        const { data: { subscription } } = supabaseHelpers.onAuthStateChange((event, session) => {
          console.log('Auth state change:', event, session); // Debug log
          if (event === 'SIGNED_IN' && session?.user) {
            handleSupabaseUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            handleSignOut();
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Failed to set up auth state listener:', error);
      }
    }
  }, []);

  const handleOAuthRedirect = async () => {
    // Check if we're on a redirect from OAuth
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    
    if (accessToken) {
      console.log('OAuth redirect detected, processing...'); // Debug log
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Let Supabase handle the session
      if (supabaseHelpers.isConfigured()) {
        try {
          const session = await supabaseHelpers.getCurrentSession();
          if (session?.user) {
            await handleSupabaseUser(session.user);
          }
        } catch (error) {
          console.error('Failed to handle OAuth redirect:', error);
        }
      }
    }
  };

  const handleSupabaseUser = async (supabaseUser: any) => {
    try {
      console.log('Handling Supabase user:', supabaseUser); // Debug log
      
      // Use only the immutable user ID for encryption key derivation
      // This ensures consistent encryption/decryption regardless of changes to email or timestamps
      const userSeed = supabaseUser.id;
      const generatedPassword = await generatePasswordFromSeed(userSeed);
      
      // Set up encryption with generated password
      await encryption.deriveKey(generatedPassword);
      encryption.setUserCredentials(supabaseUser.email || '', generatedPassword);
      
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || 
              supabaseUser.user_metadata?.name || 
              supabaseUser.email?.split('@')[0] || 
              'User',
        createdAt: supabaseUser.created_at || new Date().toISOString(),
        isSupabaseUser: true
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('bookkeeper-user', JSON.stringify(userData));
      
      console.log('User authenticated successfully:', userData.name); // Debug log
    } catch (error) {
      console.error('Failed to handle Supabase user:', error);
    }
  };

  const handleSignOut = () => {
    encryption.clearKey();
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('bookkeeper-user');
  };

  // Generate a deterministic password from user seed for encryption
  const generatePasswordFromSeed = async (seed: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(seed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const checkAuthStatus = async () => {
    // First check Supabase authentication (only if configured)
    if (supabaseHelpers.isConfigured()) {
      try {
        const supabaseUser = await supabaseHelpers.getCurrentUser();
        if (supabaseUser) {
          await handleSupabaseUser(supabaseUser);
          return;
        }
      } catch (error) {
        console.error('Supabase auth check failed:', error);
        // Continue to local auth check
      }
    }

    // Fallback to local authentication
    const storedUser = localStorage.getItem('bookkeeper-user');
    if (storedUser && encryption.isAuthenticated()) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('bookkeeper-user');
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Try Supabase authentication first (only if configured)
      if (supabaseHelpers.isConfigured()) {
        try {
          const { data, error } = await supabaseHelpers.signIn(email, password);
          if (!error && data.user) {
            // User will be handled by the auth state change listener
            return { success: true };
          }
          
          // Handle specific Supabase errors
          if (error) {
            console.error('Supabase login failed:', error.message);
            
            if (error.message.includes('Invalid login credentials')) {
              return { 
                success: false, 
                error: 'No account found with these credentials. Please check your email and password, or sign up for a new account.' 
              };
            } else if (error.message.includes('Email not confirmed')) {
              return { 
                success: false, 
                error: 'Please check your email and click the confirmation link before signing in.' 
              };
            } else if (error.message.includes('Too many requests')) {
              return { 
                success: false, 
                error: 'Too many login attempts. Please wait a few minutes before trying again.' 
              };
            } else {
              return { 
                success: false, 
                error: `Login failed: ${error.message}` 
              };
            }
          }
        } catch (supabaseError) {
          console.error('Supabase connection error:', supabaseError);
          // Fall through to local authentication
        }
      }

      // Fallback to local authentication
      const storedCredentials = localStorage.getItem(`bookkeeper-credentials-${email}`);
      
      if (!storedCredentials) {
        const configStatus = supabaseHelpers.getConfigStatus();
        if (!configStatus.configured) {
          return { 
            success: false, 
            error: 'No local account found. Please sign up first, or configure Supabase for cloud authentication.' 
          };
        } else {
          return { 
            success: false, 
            error: 'No account found with this email. Please check your credentials or sign up for a new account.' 
          };
        }
      }

      const credentials = JSON.parse(storedCredentials);
      
      // Verify password by attempting to decrypt test data
      try {
        await encryption.decrypt(credentials.testData, password);
      } catch {
        return { 
          success: false, 
          error: 'Incorrect password. Please try again.' 
        };
      }

      // Set up encryption key and store credentials
      await encryption.deriveKey(password);
      encryption.setUserCredentials(email, password);
      
      const userData: User = {
        id: credentials.userId,
        email: email,
        name: credentials.name,
        createdAt: credentials.createdAt,
        isSupabaseUser: false
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('bookkeeper-user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred during login. Please try again.' 
      };
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Try Supabase signup first (only if configured)
      if (supabaseHelpers.isConfigured()) {
        try {
          const { data, error } = await supabaseHelpers.signUp(email, password, { 
            full_name: name,
            name: name 
          });
          if (!error && data.user) {
            // User will be handled by the auth state change listener
            return { success: true };
          }
          
          if (error) {
            console.error('Supabase signup failed:', error.message);
            
            if (error.message.includes('User already registered')) {
              return { 
                success: false, 
                error: 'An account with this email already exists. Please sign in instead.' 
              };
            } else if (error.message.includes('Password should be at least')) {
              return { 
                success: false, 
                error: 'Password is too weak. Please use at least 6 characters.' 
              };
            } else if (error.message.includes('Unable to validate email address')) {
              return { 
                success: false, 
                error: 'Please enter a valid email address.' 
              };
            } else {
              return { 
                success: false, 
                error: `Signup failed: ${error.message}` 
              };
            }
          }
        } catch (supabaseError) {
          console.error('Supabase connection error:', supabaseError);
          // Fall through to local signup
        }
      }

      // Fallback to local signup
      const existingCredentials = localStorage.getItem(`bookkeeper-credentials-${email}`);
      if (existingCredentials) {
        return { 
          success: false, 
          error: 'An account with this email already exists locally. Please sign in instead.' 
        };
      }

      // Set up encryption key and store credentials
      await encryption.deriveKey(password);
      encryption.setUserCredentials(email, password);
      
      // Create test data to verify password later
      const testData = await encryption.encrypt({ test: 'authentication' }, password);
      
      const userId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      
      // Store credentials
      const credentials = {
        userId,
        name,
        testData,
        createdAt
      };
      
      localStorage.setItem(`bookkeeper-credentials-${email}`, JSON.stringify(credentials));
      
      const userData: User = {
        id: userId,
        email,
        name,
        createdAt,
        isSupabaseUser: false
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('bookkeeper-user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred during signup. Please try again.' 
      };
    }
  };

  const googleAuth = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Try Supabase Google OAuth first (only if configured)
      if (supabaseHelpers.isConfigured()) {
        try {
          const { data, error } = await supabaseHelpers.signInWithGoogle();
          if (!error) {
            // The redirect will handle the authentication
            // User will be handled by the auth state change listener when they return
            return { success: true };
          }
          
          console.error('Supabase Google auth failed:', error);
          return { 
            success: false, 
            error: `Google authentication failed: ${error.message}` 
          };
        } catch (supabaseError) {
          console.error('Supabase Google auth connection error:', supabaseError);
          return {
            success: false,
            error: 'Failed to connect to authentication service. Please check your internet connection and try again.'
          };
        }
      }

      // Fallback message when Supabase is not configured
      return {
        success: false,
        error: 'Google authentication requires Supabase to be configured. Please set up your Supabase environment variables or use email/password authentication.'
      };
    } catch (error) {
      console.error('Google authentication failed:', error);
      return { 
        success: false, 
        error: 'Google authentication failed. Please try again.' 
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Sign out from Supabase if authenticated there
      if (user?.isSupabaseUser && supabaseHelpers.isConfigured()) {
        await supabaseHelpers.signOut();
      }
    } catch (error) {
      console.error('Supabase logout failed:', error);
    }

    // Clear local state and credentials
    handleSignOut();
  };

  return {
    isAuthenticated,
    user,
    login,
    signup,
    googleAuth,
    logout,
  };
}