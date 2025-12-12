import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { type UserProfile } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: any;
  created_at?: string;
  profile: UserProfile | null;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Dynamic URL Helper
const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
           process?.env?.NEXT_PUBLIC_SITE_URL ?? 
           'http://localhost:3000'
  
  // Handle undefined or null url
  if (!url) {
    url = 'http://localhost:3000';
  }
  
  // Ensure url has protocol
  url = url.startsWith('http') ? url : `https://${url}`
  
  // Ensure url ends with slash
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

export const authService = {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Fetch profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email || "",
      user_metadata: user.user_metadata,
      created_at: user.created_at,
      profile: profile as UserProfile | null
    };
  },

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Sign up with email and password
  async signUp(email: string, password: string, username: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/confirm-email`,
          data: {
            username,
            display_name: username,
          }
        }
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser: AuthUser | null = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at,
        profile: null
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign up" } 
      };
    }
  },

  // Resend confirmation email
  async resendConfirmation(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${getURL()}auth/confirm-email`
        }
      });

      if (error) {
        return { error: { message: error.message, code: error.status?.toString() } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during email resend" } 
      };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser: AuthUser | null = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at,
        profile: null
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign in" } 
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during sign out" } 
      };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during password reset" } 
      };
    }
  },

  // Confirm email (REQUIRED)
  async confirmEmail(token: string, type: 'signup' | 'recovery' | 'email_change' = 'signup'): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser: AuthUser | null = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at,
        profile: null
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during email confirmation" } 
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Admin Debug Methods
  async debugAuthState(email: string): Promise<any> {
    // Check if user exists in public users table
    const { data: publicUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', email) // Assuming username check for now, or fetch by id if possible
      .maybeSingle();

    // Since we can't easily check auth.users from client without admin key,
    // we return what we can see from the public side and current session
    const { data: { session } } = await supabase.auth.getSession();
    const isCurrentUser = session?.user?.email === email;

    return {
      email,
      authUserExists: isCurrentUser, // approximate
      authUserConfirmed: isCurrentUser ? !!session?.user?.email_confirmed_at : false,
      publicUserExists: !!publicUser,
      currentSession: !!session,
      isOrphaned: isCurrentUser && !publicUser,
      authUserId: isCurrentUser ? session?.user?.id : null,
      publicUserId: publicUser?.id,
      authUserCreatedAt: isCurrentUser ? session?.user?.created_at : null
    };
  },

  async clearOrphanedAuthData(email?: string): Promise<{ message: string }> {
    console.warn("clearOrphanedAuthData is not implemented on client side");
    return { message: "Action requires server-side admin privileges" };
  },

  async nuclearAuthReset(): Promise<{ message: string }> {
    console.warn("nuclearAuthReset is not implemented on client side");
    return { message: "Action requires server-side admin privileges" };
  },

  async forceSignUp(email: string, password: string, username: string): Promise<any> {
    // Attempt standard signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username }
      }
    });

    if (error) throw error;
    return { user: data.user, message: "Signup requested" };
  },

  async advancedDebugEmail(email: string): Promise<any> {
    // Re-use debugAuthState for now, or expand if needed
    return this.debugAuthState(email);
  },

  async forceCleanupEmail(email: string): Promise<{ success: boolean; message: string }> {
    console.warn("forceCleanupEmail is not implemented on client side");
    return { success: false, message: "Action requires server-side admin privileges" };
  },

  async superNuclearReset(): Promise<{ message: string }> {
    console.warn("superNuclearReset is not implemented on client side");
    return { message: "Action requires server-side admin privileges" };
  }
};
