import { supabase } from "@/integrations/supabase/client";

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
  async signUp(email: string, password: string, username: string) {
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

    if (error) throw error;

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            username,
            display_name: username,
          }
        ]);

      if (profileError) throw profileError;

      // Create user preferences with first/last name from form
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .insert([
          {
            user_id: data.user.id,
          }
        ]);

      if (preferencesError) throw preferencesError;
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    if (error) throw error;
  },

  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`
      }
    });
    if (error) throw error;
  }
};

export default authService;
