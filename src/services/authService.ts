
import { supabase } from "@/integrations/supabase/client";

// Helper function to parse Supabase auth errors into user-friendly messages
const parseAuthError = (error: any): string => {
  if (!error) return "An unknown error occurred";
  
  const message = error.message?.toLowerCase() || "";
  
  // Handle RLS policy violations
  if (message.includes("row-level security policy") || message.includes("rls")) {
    return "Database security policy error. Please contact support or try again later.";
  }
  
  // Handle password complexity issues - check for specific Supabase password errors
  if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("simple"))) {
    return "Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.";
  }
  
  if (message.includes("password") && message.includes("length")) {
    return "Password must be at least 8 characters long.";
  }
  
  // Check for password policy violations from Supabase
  if (message.includes("password does not meet") || message.includes("password policy")) {
    return "Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.";
  }
  
  // Handle specific Supabase auth error codes
  if (error.status === 422) {
    // Check if it's actually a password issue disguised as user exists
    if (message.includes("password")) {
      return "Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.";
    }
    if (message.includes("user already registered") || message.includes("already exists")) {
      return "An account with this email address already exists. Please try signing in instead.";
    }
    return "Invalid input. Please check your email and password requirements.";
  }
  
  // Handle 400 errors which might be password related
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
  
  // Handle database constraint errors
  if (message.includes("duplicate") || message.includes("unique")) {
    if (message.includes("username")) {
      return "This username is already taken. Please choose a different username.";
    }
    return "An account with this information already exists.";
  }
  
  // Return the original error message if we can't parse it
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
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const authService = {
  async signUp(email: string, password: string, username: string) {
    try {
      console.log("🚀 Starting simplified signup process for:", email);
      
      // Validate password complexity on frontend first
      const passwordRequirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      
      const isPasswordValid = Object.values(passwordRequirements).every(req => req);
      
      if (!isPasswordValid) {
        throw new Error("Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters.");
      }
      
      console.log("📧 Attempting Supabase auth signup with timeout...");
      
      // Sign up with email confirmation - with timeout protection
      const signupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            username: username,
            display_name: username
          }
        }
      });

      const { data, error } = await withTimeout(signupPromise, 30000); // 30 second timeout

      console.log("📧 Supabase auth signup response:", { data, error });

      if (error) {
        console.error("❌ Auth signup error:", error);
        throw error;
      }

      // Check if user was created successfully
      if (data.user && data.user.identities && data.user.identities.length > 0) {
        console.log("👤 Creating user profile for:", data.user.id);
        
        // Create user profile with timeout protection
        const profilePromise = supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              username,
              display_name: username,
            }
          ]);

        const { error: profileError } = await withTimeout(profilePromise, 10000); // 10 second timeout

        if (profileError) {
          console.error("❌ Profile creation error:", profileError);
          // Don't throw here - user is created in auth, profile can be created later
          console.log("⚠️ Profile creation failed, but user auth was successful");
        }

        console.log("⚙️ Creating user preferences for:", data.user.id);
        
        // Create user preferences with timeout protection
        const preferencesPromise = supabase
          .from('user_preferences')
          .insert([
            {
              user_id: data.user.id,
            }
          ]);

        const { error: preferencesError } = await withTimeout(preferencesPromise, 10000); // 10 second timeout

        if (preferencesError) {
          console.error("❌ Preferences creation error:", preferencesError);
          // Don't throw here - user is created in auth, preferences can be created later
          console.log("⚠️ Preferences creation failed, but user auth was successful");
        }
        
        console.log("✅ User signup completed successfully");
      } else if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        // This means the user already exists but isn't confirmed
        console.log("⚠️ User exists but not confirmed");
        // Don't throw an error, just return the data - the UI will handle this
      }

      return data;
    } catch (error) {
      console.error("💥 Signup process failed:", error);
      // Parse and throw a user-friendly error message
      const friendlyMessage = parseAuthError(error);
      const enhancedError = new Error(friendlyMessage);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = await withTimeout(signInPromise, 15000); // 15 second timeout

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
      const signOutPromise = supabase.auth.signOut();
      const { error } = await withTimeout(signOutPromise, 10000); // 10 second timeout
      if (error) throw error;
    } catch (error) {
      console.error("Sign out error:", error);
      // Clear local storage as fallback
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const getUserPromise = supabase.auth.getUser();
      const { data: { user } } = await withTimeout(getUserPromise, 10000);
      
      if (!user) return null;

      // Get user profile with timeout
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: profile } = await withTimeout(profilePromise, 10000);

      if (!profile) return null;

      // Get user preferences with timeout
      const preferencesPromise = supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: preferences } = await withTimeout(preferencesPromise, 10000);

      // Get following/followers count with timeout
      const followingPromise = supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followersPromise = supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id);

      const [{ data: following }, { data: followers }] = await Promise.all([
        withTimeout(followingPromise, 10000),
        withTimeout(followersPromise, 10000)
      ]);

      return {
        id: user.id,
        username: profile.username,
        email: user.email || '',
        name: profile.display_name || profile.username,
        profileImage: profile.profile_image_url,
        bio: profile.bio,
        following: following?.map(f => f.following_id) || [],
        followers: followers?.map(f => f.follower_id) || [],
        preferences: {
          coffeeTypes: preferences?.coffee_types || [],
          region: preferences?.region,
          firstName: preferences?.first_name,
          lastName: preferences?.last_name,
        }
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  async resetPassword(email: string) {
    try {
      console.log("🔄 Starting password reset for:", email);
      
      // Get the current origin dynamically
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      console.log("🔗 Redirect URL:", redirectUrl);
      
      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      const { data, error } = await withTimeout(resetPromise, 15000); // 15 second timeout

      console.log("📧 Supabase response data:", data);
      console.log("❌ Supabase response error:", error);

      if (error) {
        console.error("❌ Password reset error details:", {
          message: error.message,
          status: error.status,
          code: error.code || 'No code',
          details: error
        });
        throw error;
      }

      console.log("✅ Password reset request sent successfully");
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
      console.log("🔄 Resending confirmation for:", email);
      
      // Get the current origin dynamically
      const redirectUrl = `${window.location.origin}/auth/confirm`;
      console.log("🔗 Confirmation redirect URL:", redirectUrl);
      
      const resendPromise = supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      const { error } = await withTimeout(resendPromise, 15000); // 15 second timeout
      
      if (error) {
        console.error("❌ Resend confirmation error:", error);
        throw error;
      }
      
      console.log("✅ Confirmation email resent successfully");
    } catch (error) {
      console.error("💥 Exception in resendConfirmation:", error);
      const friendlyMessage = parseAuthError(error);
      const enhancedError = new Error(friendlyMessage);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  }
};

export default authService;
