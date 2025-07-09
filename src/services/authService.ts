
import { supabase } from "@/integrations/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

// Helper function to parse Supabase auth errors into user-friendly messages
const parseAuthError = (error: any): string => {
  if (!error) return "An unknown error occurred";
  
  const message = error.message?.toLowerCase() || "";
  
  if (message.includes("row-level security policy") || message.includes("rls")) {
    return "Database security policy error. Please contact support or try again later.";
  }
  
  if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("simple"))) {
    return "Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.";
  }
  
  if (message.includes("password") && message.includes("length")) {
    return "Password must be at least 8 characters long.";
  }
  
  if (message.includes("password does not meet") || message.includes("password policy")) {
    return "Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.";
  }
  
  if (error.status === 422) {
    if (message.includes("password")) {
      return "Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.";
    }
    if (message.includes("user already registered") || message.includes("already exists")) {
      return "An account with this email address already exists. Please try signing in instead.";
    }
    return "Invalid input. Please check your email and password requirements.";
  }
  
  if (error.status === 400) {
    if (message.includes("password")) {
      return "Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.";
    }
  }
  
  if (message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  
  if (message.includes("signup") && message.includes("disabled")) {
    return "Account registration is currently disabled. Please contact support.";
  }
  
  if (message.includes("rate limit")) {
    return "Too many signup attempts. Please wait a few minutes before trying again.";
  }
  
  if (message.includes("email") && message.includes("not confirmed")) {
    return "Please check your email and click the confirmation link before signing in.";
  }
  
  if (message.includes("network") || message.includes("connection")) {
    return "Network error. Please check your internet connection and try again.";
  }
  
  if (message.includes("duplicate") || message.includes("unique")) {
    if (message.includes("username")) {
      return "This username is already taken. Please choose a different username.";
    }
    return "An account with this information already exists.";
  }
  
  return error.message || "An unexpected error occurred. Please try again.";
};

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  following: string[];
  followers: string[];
  preferences: {
    coffeeTypes: string[];
    region: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

// Helper function to create a timeout promise
const withTimeout = <T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const authService = {
  async signUp(email: string, password: string, username: string) {
    try {
      console.log("🚀 Starting signup process for:", email);
      
      const passwordRequirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      
      if (!Object.values(passwordRequirements).every(req => req)) {
        throw new Error("Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.");
      }
      
      console.log("📧 Attempting Supabase auth signup with timeout...");
      
      const signupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
           {
            username: username,
            display_name: username
          }
        }
      });

      const { data, error } = await withTimeout(signupPromise, 30000);

      if (error) {
        console.error("❌ Auth signup error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("Could not create user. The user may already exist or another error occurred.");
      }

      if (data.user && data.user.identities && data.user.identities.length > 0) {
        console.log("👤 Creating user profile for:", data.user.id);
        
        const profilePromise = supabase
          .from('users')
          .insert([{ id: data.user.id, username, display_name: username }]);

        const { error: profileError } = await withTimeout(profilePromise, 15000);

        if (profileError) {
          console.error("❌ Profile creation error:", profileError);
          throw new Error("Your account was created, but we failed to set up your profile. Please contact support.");
        }

        console.log("⚙️ Creating user preferences for:", data.user.id);
        
        const preferencesPromise = supabase
          .from('user_preferences')
          .insert([{ user_id: data.user.id }]);

        const { error: preferencesError } = await withTimeout(preferencesPromise, 15000);

        if (preferencesError) {
          console.error("❌ Preferences creation error:", preferencesError);
          throw new Error("Your account was created, but we failed to set up your preferences. Please contact support.");
        }
        
        console.log("✅ User signup completed successfully");
      } else if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        console.log("⚠️ User exists but not confirmed");
      }

      return data;
    } catch (error) {
      console.error("💥 Signup process failed:", error);
      const friendlyMessage = parseAuthError(error);
      const enhancedError = new Error(friendlyMessage);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const { data, error } = await withTimeout(signInPromise, 15000);
      if (error) throw error;
      return data;
    } catch (error) {
      const friendlyMessage = parseAuthError(error);
      const enhancedError = new Error(friendlyMessage);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  },

  async signOut() {
    try {
      const { error } = await withTimeout(supabase.auth.signOut(), 10000);
      if (error) throw error;
    } catch (error) {
      console.error("Sign out error:", error);
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const {  { user }, error: userError } = await withTimeout(supabase.auth.getUser(), 10000);
      
      if (userError || !user) {
        if(userError) console.error("Get user error:", userError.message);
        return null;
      }

      const {  profile, error: profileError } = await withTimeout(
        supabase.from('users').select('*').eq('id', user.id).single(), 
        10000
      );

      if (profileError || !profile) {
        if(profileError) console.error("Get profile error:", profileError.message);
        return null;
      }

      const {  preferences, error: preferencesError } = await withTimeout(
        supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
        10000
      );

      if (preferencesError) {
        console.warn("Could not fetch user preferences:", preferencesError.message);
      }

      const [followingResult, followersResult] = await Promise.all([
        withTimeout(supabase.from('follows').select('following_id').eq('follower_id', user.id), 10000),
        withTimeout(supabase.from('follows').select('follower_id').eq('following_id', user.id), 10000)
      ]);

      if (followingResult.error) console.warn("Could not fetch following list:", followingResult.error.message);
      if (followersResult.error) console.warn("Could not fetch followers list:", followersResult.error.message);

      return {
        id: user.id,
        username: profile.username,
        email: user.email || '',
        name: profile.display_name || profile.username,
        profileImage: profile.profile_image_url,
        bio: profile.bio,
        following: followingResult.data?.map((f: any) => f.following_id) || [],
        followers: followersResult.data?.map((f: any) => f.follower_id) || [],
        preferences: {
          coffeeTypes: preferences?.coffee_types || [],
          region: preferences?.region || null,
          firstName: preferences?.first_name || null,
          lastName: preferences?.last_name || null,
        }
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  async resetPassword(email: string) {
    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      const { data, error } = await withTimeout(supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl }), 15000);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("💥 Exception in resetPassword:", error);
      const friendlyMessage = parseAuthError(error);
      const enhancedError = new Error(friendlyMessage);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  },

  async resendConfirmation(email: string) {
    try {
      const redirectUrl = `${window.location.origin}/auth/confirm`;
      const { error } = await withTimeout(supabase.auth.resend({ type: 'signup', email: email, options: { emailRedirectTo: redirectUrl } }), 15000);
      if (error) throw error;
    } catch (error) {
      console.error("💥 Exception in resendConfirmation:", error);
      const friendlyMessage = parseAuthError(error);
      const enhancedError = new Error(friendlyMessage);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  },

  // Dummy functions to fix build errors in admin pages
  async debugAuthState() { console.log("debugAuthState not implemented"); return {}; },
  async clearOrphanedAuthData() { console.log("clearOrphanedAuthData not implemented"); },
  async nuclearAuthReset() { console.log("nuclearAuthReset not implemented"); },
  async forceSignUp(email: string, password: string): Promise<{  any, error: any }> { 
    console.log("forceSignUp not implemented"); 
    return {  null, error: new Error("Not implemented") }; 
  },
  async advancedDebugEmail(email: string) { console.log("advancedDebugEmail not implemented"); },
  async forceCleanupEmail(email: string) { console.log("forceCleanupEmail not implemented"); },
  async superNuclearReset() { console.log("superNuclearReset not implemented"); },
};

export default authService;
