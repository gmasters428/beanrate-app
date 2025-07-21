
import { supabase } from "@/integrations/supabase/client";

export interface UserProfileUpdate {
  bio?: string;
  display_name?: string;
  profile_image_url?: string;
}

export interface UserPreferencesUpdate {
  first_name?: string;
  last_name?: string;
  region?: string;
  coffee_types?: string[];
}

export const userService = {
  async updateProfile(userId: string, updates: UserProfileUpdate) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  },

  async updatePreferences(userId: string, updates: UserPreferencesUpdate) {
    // First, try to update existing preferences
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingPrefs) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }

      return data;
    } else {
      // Create new preferences record
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user preferences:', error);
        throw error;
      }

      return data;
    }
  },

  async createUserProfile(userId: string, username: string, email: string) {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: username,
        display_name: username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    return data;
  }
};

export default userService;
