
import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { type UserProfile } from "@/types";

type AuthUser = {
  id: string;
  email: string;
  profile: {
    id: string;
    username: string;
    display_name: string;
    bio: string;
    profile_image_url: string;
    created_at: string;
    updated_at: string;
  };
} | null;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn?: (email: string, password: string) => Promise<void>;
  signOut?: () => Promise<void>;
  refreshUser?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Refs for cleanup and preventing memory leaks
  const mountedRef = useRef(true);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Safe state updater that checks if component is still mounted
  const safeSetState = useCallback(<T,>(setter: (value: T | ((prev: T) => T)) => void, value: T | ((prev: T) => T)) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!mountedRef.current) return;
    
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    try {
      // Add timeout for auth requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        refreshTimeoutRef.current = setTimeout(() => {
          reject(new Error('Authentication timeout'));
        }, 8000); // 8 second timeout
      });

      const authPromise = authService.getCurrentUser();
      const currentUser = await Promise.race([authPromise, timeoutPromise]);
      
      // Clear timeout on success
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      safeSetState(setUser, currentUser);
    } catch (error) {
      // Clear timeout on error
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      if (mountedRef.current && error instanceof Error && !error.message.includes('timeout')) {
        console.error("Error refreshing user:", error);
        safeSetState(setUser, null);
      }
    }
  }, [safeSetState]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!mountedRef.current) return;

    // Clear any existing timeout
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
    }

    try {
      // Add timeout for sign in
      const timeoutPromise = new Promise<never>((_, reject) => {
        authTimeoutRef.current = setTimeout(() => {
          reject(new Error('Sign in timeout - please check your connection'));
        }, 10000); // 10 second timeout for sign in
      });

      const signInPromise = authService.signIn(email, password);
      await Promise.race([signInPromise, timeoutPromise]);
      
      // Clear timeout on success
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }

      // Ensure user profile exists via RPC (best-effort, ignore errors)
      try {
        await supabase.rpc('ensure_user_profile');
      } catch (error) {
        // Silently ignore profile RPC errors
        console.debug('Profile RPC call completed with:', error);
      }

      await refreshUser();
    } catch (error) {
      // Clear timeout on error
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      throw error; // Re-throw to let calling component handle
    }
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      await authService.signOut();
      safeSetState(setUser, null);
    } catch (error) {
      console.error("Error signing out:", error);
      // Force clear user state even if sign out fails
      safeSetState(setUser, null);
    }
  }, [safeSetState]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!mountedRef.current) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mountedRef.current) {
          const currentUser = await authService.getCurrentUser();
          safeSetState(setUser, currentUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        safeSetState(setLoading, false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_IN' && session?.user) {
          if (mountedRef.current) {
            const currentUser = await authService.getCurrentUser();
            safeSetState(setUser, currentUser);
          }
        } else if (event === 'SIGNED_OUT') {
          safeSetState(setUser, null);
        }
        
        safeSetState(setLoading, false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [safeSetState]);

  // Connection recovery mechanism - retry auth on network recovery
  useEffect(() => {
    const handleOnline = () => {
      if (mountedRef.current && !user && !loading) {
        console.log("Network recovered, attempting to restore authentication...");
        // Debounce the refresh attempt
        const timeout = setTimeout(() => {
          if (mountedRef.current) {
            refreshUser();
          }
        }, 1000);

        return () => clearTimeout(timeout);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, loading, refreshUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};