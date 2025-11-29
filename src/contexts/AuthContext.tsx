
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

// Helper to detect transient errors that should not clear user state
const isTransientError = (error: any): boolean => {
  if (!error) return false;
  const message = error?.message || String(error);
  return (
    message.includes("Operation timed out") ||
    message.includes("timeout") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("Network request failed") ||
    message.includes("Failed to fetch") ||
    error.name === "AbortError"
  );
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Refs for cleanup and preventing memory leaks
  const mountedRef = useRef(true);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Safe state updater that checks if component is still mounted
  const safeSetState = useCallback(<T,>(setter: (value: T | ((prev: T) => T)) => void, value: T | ((prev: T) => T)) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  const refreshUser = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;
    
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    try {
      const currentUser = await authService.getCurrentUser();
      safeSetState(setUser, currentUser);
    } catch (error) {
      // Clear timeout on error
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      // Check if this is a transient error
      if (isTransientError(error)) {
        console.warn("Transient auth error (keeping current user state):", error);
        
        // Schedule a silent retry if this isn't already a retry
        if (!isRetry && mountedRef.current) {
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log("Retrying auth refresh after transient error...");
              refreshUser(true);
            }
          }, 3000); // Retry after 3 seconds
        }
        // DO NOT clear user state on transient errors
        return;
      }

      // Only clear user state on non-transient errors
      if (mountedRef.current) {
        console.error("Non-transient auth error (clearing user state):", error);
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
      await authService.signIn(email, password);
      
      // Clear timeout on success
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }

      // Ensure user profile exists via RPC (best-effort, ignore errors)
      try {
        await (supabase.rpc as any)('ensure_user_profile');
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If session fetch failed with transient error, keep trying but don't fail initialization
        if (sessionError && isTransientError(sessionError)) {
          console.warn("Transient error fetching session, will retry:", sessionError);
          safeSetState(setLoading, false);
          // Schedule a retry
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && !user) {
              console.log("Retrying session initialization...");
              initializeAuth();
            }
          }, 2000);
          return;
        }
        
        if (session?.user && mountedRef.current) {
          try {
            const currentUser = await authService.getCurrentUser();
            safeSetState(setUser, currentUser);
          } catch (userError) {
            // If getting user profile fails with transient error, keep session but retry
            if (isTransientError(userError)) {
              console.warn("Transient error fetching user profile, will retry:", userError);
              // Schedule a retry
              if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
              }
              retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current && session?.user) {
                  refreshUser();
                }
              }, 2000);
            } else {
              console.error("Error fetching user profile:", userError);
            }
          }
        }
      } catch (error) {
        // Only log non-transient errors
        if (!isTransientError(error)) {
          console.error("Error initializing auth:", error);
        } else {
          console.warn("Transient initialization error:", error);
        }
      } finally {
        safeSetState(setLoading, false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        console.debug("Auth state change event:", event);

        // Only handle explicit sign-in and sign-out events
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const currentUser = await authService.getCurrentUser();
            safeSetState(setUser, currentUser);
          } catch (error) {
            // If user fetch fails with transient error, keep the session
            if (isTransientError(error)) {
              console.warn("Transient error during SIGNED_IN, keeping session:", error);
              // Schedule a retry to fetch user profile
              if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
              }
              retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current && session?.user) {
                  refreshUser();
                }
              }, 2000);
            } else {
              console.error("Error fetching user after SIGNED_IN:", error);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Only clear user on explicit sign-out
          safeSetState(setUser, null);
        } else if (event === 'TOKEN_REFRESHED') {
          // On token refresh, try to update user but don't clear on failure
          if (session?.user && mountedRef.current) {
            try {
              const currentUser = await authService.getCurrentUser();
              safeSetState(setUser, currentUser);
            } catch (error) {
              // Keep existing user state on transient refresh errors
              if (isTransientError(error)) {
                console.warn("Transient error during TOKEN_REFRESHED, keeping current user:", error);
              } else {
                console.error("Error refreshing user profile:", error);
              }
            }
          }
        }
        // For other events (USER_UPDATED, PASSWORD_RECOVERY, etc.), keep current state
        
        safeSetState(setLoading, false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [safeSetState, refreshUser]);

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
