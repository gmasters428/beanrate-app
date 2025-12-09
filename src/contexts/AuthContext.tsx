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

type AuthStatus = 'loading' | 'idle' | 'signedIn' | 'signedOut' | 'recovering' | 'error';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  status: AuthStatus;
  signIn?: (email: string, password: string) => Promise<void>;
  signOut?: () => Promise<void>;
  refreshUser?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  status: 'loading',
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

// Helper to detect definitive invalid session errors
const isInvalidSessionError = (error: any): boolean => {
  if (!error) return false;
  const message = error?.message || String(error);
  const status = error?.status || error?.statusCode;
  return (
    status === 401 ||
    message.includes("invalid") ||
    message.includes("expired") ||
    message.includes("JWT")
  );
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AuthStatus>('loading');
  
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
      safeSetState(setStatus, currentUser ? 'signedIn' : 'signedOut');
    } catch (error) {
      // Clear timeout on error
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      // Check if this is a transient error
      if (isTransientError(error)) {
        console.warn("Transient auth error during refresh (keeping current user state):", error);
        safeSetState(setStatus, 'recovering');
        
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

      // Check if this is a definitive invalid session
      if (isInvalidSessionError(error)) {
        console.log("Invalid session detected (clearing user state):", error);
        safeSetState(setUser, null);
        safeSetState(setStatus, 'signedOut');
        return;
      }

      // For other non-transient errors, log but keep previous state
      console.error("Non-transient auth error during refresh:", error);
      safeSetState(setStatus, 'error');
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
      safeSetState(setStatus, 'signedOut');
    } catch (error) {
      console.error("Error signing out:", error);
      // Force clear user state even if sign out fails
      safeSetState(setUser, null);
      safeSetState(setStatus, 'signedOut');
    }
  }, [safeSetState]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!mountedRef.current) return;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If session fetch failed with transient error, keep trying but don't fail initialization
        if (sessionError) {
          if (isTransientError(sessionError)) {
            console.warn("Transient error fetching session on mount, will retry:", sessionError);
            safeSetState(setLoading, false);
            safeSetState(setStatus, 'recovering');
            // Schedule a retry
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                console.log("Retrying session initialization...");
                initializeAuth();
              }
            }, 2000);
            return;
          }
          
          // If it's an invalid session error, mark as signed out
          if (isInvalidSessionError(sessionError)) {
            console.log("Invalid session on mount (signing out):", sessionError);
            safeSetState(setUser, null);
            safeSetState(setStatus, 'signedOut');
            safeSetState(setLoading, false);
            return;
          }
          
          // For other errors, log but continue with no session
          console.error("Error fetching session on mount:", sessionError);
          safeSetState(setUser, null);
          safeSetState(setStatus, 'error');
          safeSetState(setLoading, false);
          return;
        }
        
        if (session?.user && mountedRef.current) {
          try {
            const currentUser = await authService.getCurrentUser();
            safeSetState(setUser, currentUser);
            safeSetState(setStatus, 'signedIn');
          } catch (userError) {
            // If getting user profile fails with transient error, keep session but retry
            if (isTransientError(userError)) {
              console.warn("Transient error fetching user profile on mount, will retry:", userError);
              safeSetState(setStatus, 'recovering');
              // Schedule a retry
              if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
              }
              retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current && session?.user) {
                  refreshUser();
                }
              }, 2000);
            } else if (isInvalidSessionError(userError)) {
              console.log("Invalid user session (signing out):", userError);
              safeSetState(setUser, null);
              safeSetState(setStatus, 'signedOut');
            } else {
              console.error("Error fetching user profile on mount:", userError);
              safeSetState(setStatus, 'error');
            }
          }
        } else {
          // No session found
          safeSetState(setUser, null);
          safeSetState(setStatus, 'signedOut');
        }
      } catch (error) {
        // Handle unexpected errors in initialization
        if (isTransientError(error)) {
          console.warn("Transient initialization error, will retry:", error);
          safeSetState(setStatus, 'recovering');
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              initializeAuth();
            }
          }, 2000);
        } else {
          console.error("Error initializing auth:", error);
          safeSetState(setUser, null);
          safeSetState(setStatus, 'error');
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
            safeSetState(setStatus, 'signedIn');
          } catch (error) {
            // If user fetch fails with transient error, keep the session
            if (isTransientError(error)) {
              console.warn("Transient error during SIGNED_IN, will retry:", error);
              safeSetState(setStatus, 'recovering');
              // Schedule a retry to fetch user profile
              if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
              }
              retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current && session?.user) {
                  refreshUser();
                }
              }, 2000);
            } else if (isInvalidSessionError(error)) {
              console.log("Invalid session during SIGNED_IN:", error);
              safeSetState(setUser, null);
              safeSetState(setStatus, 'signedOut');
            } else {
              console.error("Error fetching user after SIGNED_IN:", error);
              safeSetState(setStatus, 'error');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Only clear user on explicit sign-out
          safeSetState(setUser, null);
          safeSetState(setStatus, 'signedOut');
        } else if (event === 'TOKEN_REFRESHED') {
          // On token refresh, try to update user but don't clear on failure
          if (session?.user && mountedRef.current) {
            try {
              const currentUser = await authService.getCurrentUser();
              safeSetState(setUser, currentUser);
              safeSetState(setStatus, 'signedIn');
            } catch (error) {
              // Keep existing user state on transient refresh errors
              if (isTransientError(error)) {
                console.warn("Transient error during TOKEN_REFRESHED, keeping current user:", error);
                safeSetState(setStatus, 'recovering');
              } else if (isInvalidSessionError(error)) {
                console.log("Invalid session during TOKEN_REFRESHED:", error);
                safeSetState(setUser, null);
                safeSetState(setStatus, 'signedOut');
              } else {
                console.error("Error refreshing user profile:", error);
                safeSetState(setStatus, 'error');
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
      if (mountedRef.current && status === 'recovering') {
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
  }, [status, refreshUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      status,
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