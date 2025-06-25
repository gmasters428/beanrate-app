import { supabase } from "@/integrations/supabase/client";

// Helper function to parse Supabase auth errors into user-friendly messages
const parseAuthError = (error: any): string => {
  if (!error) return "An unknown error occurred";
  
  const message = error.message?.toLowerCase() || "";
  
  // Handle specific Supabase auth error codes
  if (error.status === 422 || message.includes("user already registered")) {
    return "An account with this email address already exists. Please try signing in instead.";
  }
  
  if (message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  
  if (message.includes("password") && message.includes("weak")) {
    return "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.";
  }
  
  if (message.includes("password") && message.includes("short")) {
    return "Password must be at least 6 characters long.";
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

export const authService = {
  // Add a cleanup function to clear orphaned auth data
  async clearOrphanedAuthData() {
    try {
      console.log("🧹 Starting cleanup of orphaned auth data...");
      
      // First, try to get any existing auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("❌ Error fetching auth users:", authError);
        // If we can't access admin functions, try clearing local storage
        localStorage.clear();
        sessionStorage.clear();
        return { success: false, message: "Could not access admin functions. Cleared local storage." };
      }
      
      console.log("👥 Found auth users:", authUsers?.users?.length || 0);
      
      // Clear any users that don't have corresponding profile records
      if (authUsers?.users && authUsers.users.length > 0) {
        for (const user of authUsers.users) {
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (!profile) {
            console.log(`🗑️ Removing orphaned auth user: ${user.email}`);
            await supabase.auth.admin.deleteUser(user.id);
          }
        }
      }
      
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("✅ Cleanup completed successfully");
      return { success: true, message: "Cleanup completed successfully" };
      
    } catch (error) {
      console.error("💥 Error during cleanup:", error);
      // Fallback: clear local storage
      localStorage.clear();
      sessionStorage.clear();
      return { success: false, message: "Cleanup failed, but cleared local storage" };
    }
  },

  // Add a debug function to check auth state
  async debugAuthState(email: string) {
    try {
      console.log("🔍 Debugging auth state for:", email);
      
      // Check if user exists in auth.users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find((u: any) => u.email === email);
      
      // Check if user exists in public.users
      const { data: publicUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser?.id || 'none')
        .single();
      
      // Check current session
      const { data: session } = await supabase.auth.getSession();
      
      const debugInfo = {
        email,
        authUserExists: !!authUser,
        authUserConfirmed: authUser?.email_confirmed_at ? true : false,
        publicUserExists: !!publicUser,
        currentSession: !!session?.session,
        authUserId: authUser?.id,
        publicUserId: publicUser?.id
      };
      
      console.log("🐛 Debug info:", debugInfo);
      return debugInfo;
      
    } catch (error) {
      console.error("💥 Error during debug:", error);
      return { error: error.message };
    }
  },

  async signUp(email: string, password: string, username: string) {
    try {
      console.log("🚀 Starting signup process for:", email);
      
      // First, check if username is already taken
      const { data: existingUsername } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
      
      if (existingUsername) {
        throw new Error("This username is already taken. Please choose a different username.");
      }
      
      // Sign up with email confirmation
      const { data, error } = await supabase.auth.signUp({
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

      console.log("📧 Supabase auth signup response:", { data, error });

      if (error) {
        console.error("❌ Auth signup error:", error);
        throw error;
      }

      if (data.user && !data.user.identities?.length) {
        // This means the user already exists but isn't confirmed
        console.log("⚠️ User exists but not confirmed, attempting to resend confirmation");
        await this.resendConfirmation(email);
        return data;
      }

      if (data.user) {
        console.log("👤 Creating user profile for:", data.user.id);
        
        // Create user profile with better error handling
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              username,
              display_name: username,
            }
          ]);

        if (profileError) {
          console.error("❌ Profile creation error:", profileError);
          // If profile creation fails, clean up the auth user
          try {
            await supabase.auth.admin.deleteUser(data.user.id);
          } catch (cleanupError) {
            console.error("❌ Cleanup error:", cleanupError);
          }
          throw profileError;
        }

        console.log("⚙️ Creating user preferences for:", data.user.id);
        
        // Create user preferences with better error handling
        const { error: preferencesError } = await supabase
          .from('user_preferences')
          .insert([
            {
              user_id: data.user.id,
            }
          ]);

        if (preferencesError) {
          console.error("❌ Preferences creation error:", preferencesError);
          // Clean up both auth user and profile
          try {
            await supabase.from('users').delete().eq('id', data.user.id);
            await supabase.auth.admin.deleteUser(data.user.id);
          } catch (cleanupError) {
            console.error("❌ Cleanup error:", cleanupError);
          }
          throw preferencesError;
        }
        
        console.log("✅ User signup completed successfully");
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get following/followers count
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const { data: followers } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', user.id);

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
  },

  async resetPassword(email: string) {
    try {
      console.log("🔄 Starting password reset for:", email);
      
      // Get the current origin dynamically
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      console.log("🔗 Redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

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
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
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
