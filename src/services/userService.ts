import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];

export type UserWithProfile = User;

export interface FriendshipStatus {
  status: "none" | "pending_sent" | "pending_received" | "accepted" | "blocked";
  friendshipId?: string;
}

export const userService = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getUserProfile(userId: string): Promise<UserWithProfile | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error getting user profile:", error);
      return null;
    };
    return data;
  },

  async createUserProfile(userId: string, email: string) {
    const username = email.split("@")[0];
    
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingUser) {
      return existingUser;
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        username: username,
        display_name: username,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadProfileImage(userId: string, file: File): Promise<string> {
    try {
      // Additional validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        throw new Error(`File type "${file.type}" is not supported. Please use JPEG, PNG, WebP, or GIF.`);
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        throw new Error(`File size (${fileSizeMB}MB) exceeds the 10MB limit.`);
      }

      // Generate unique filename with folder structure that matches RLS policy
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;
      // Use folder structure: userId/filename.ext (this matches the RLS policy expectation)
      const filePath = `${userId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update user profile with new image URL
      await this.updateUserProfile(userId, {
        profile_image_url: publicUrl
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },

  async removeProfileImage(userId: string): Promise<void> {
    try {
      // Get current user to find existing image
      const user = await this.getUserProfile(userId);
      if (!user?.profile_image_url) return;

      // Extract file path from URL - Updated to handle folder structure
      const url = new URL(user.profile_image_url);
      const pathParts = url.pathname.split('/');
      // Get the last two parts: userId/filename.ext
      const filePath = pathParts.slice(-2).join('/');

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-images')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Error deleting old profile image:', deleteError);
      }

      // Update user profile to remove image URL
      await this.updateUserProfile(userId, {
        profile_image_url: null
      });
    } catch (error) {
      console.error('Error removing profile image:', error);
      throw error;
    }
  },
  
  async updatePreferences(userId: string, updates: Partial<UserPreferences>) {
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("user_preferences")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({
          user_id: userId,
          ...updates
        });

      if (error) throw error;
      return data;
    }
  },

  async searchUsers(query: string, limit = 10): Promise<UserWithProfile[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data as UserWithProfile[];
  },

  async sendFriendRequest(receiverId: string) {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const existingFriendship = await this.getFriendshipStatus(receiverId);
    if (existingFriendship.status !== "none") {
      throw new Error("Friendship request already exists or users are already friends");
    }

    const userOneId = currentUser.id < receiverId ? currentUser.id : receiverId;
    const userTwoId = currentUser.id < receiverId ? receiverId : currentUser.id;

    const { data, error } = await supabase
      .from("friendships")
      .insert({
        user_one_id: userOneId,
        user_two_id: userTwoId,
        action_user_id: currentUser.id,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async acceptFriendRequest(requesterId: string) {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("friendships")
      .update({ 
        status: "accepted",
        updated_at: new Date().toISOString()
      })
      .or(`and(user_one_id.eq.${requesterId},user_two_id.eq.${currentUser.id}),and(user_one_id.eq.${currentUser.id},user_two_id.eq.${requesterId})`)
      .eq("action_user_id", requesterId)
      .eq("status", "pending")
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectFriendRequest(requesterId: string) {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`and(user_one_id.eq.${requesterId},user_two_id.eq.${currentUser.id}),and(user_one_id.eq.${currentUser.id},user_two_id.eq.${requesterId})`)
      .eq("action_user_id", requesterId)
      .eq("status", "pending");

    if (error) throw error;
    return true;
  },

  async removeFriend(friendId: string) {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`and(user_one_id.eq.${friendId},user_two_id.eq.${currentUser.id}),and(user_one_id.eq.${currentUser.id},user_two_id.eq.${friendId})`)
      .eq("status", "accepted");

    if (error) throw error;
    return true;
  },

  async getFriendshipStatus(otherUserId: string): Promise<FriendshipStatus> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return { status: "none" };

    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(user_one_id.eq.${currentUser.id},user_two_id.eq.${otherUserId}),and(user_one_id.eq.${otherUserId},user_two_id.eq.${currentUser.id})`);

    if (error) {
      console.error("Error getting friendship status:", error);
      return { status: "none" };
    }

    if (!data || data.length === 0) return { status: "none" };

    // Take the first/most recent friendship record if multiple exist
    const friendship = data[0];

    if (friendship.status === "accepted") {
      return { status: "accepted", friendshipId: friendship.id };
    }

    if (friendship.status === "pending") {
      if (friendship.action_user_id === currentUser.id) {
        return { status: "pending_sent", friendshipId: friendship.id };
      } else {
        return { status: "pending_received", friendshipId: friendship.id };
      }
    }

    if (friendship.status === "blocked") {
      return { status: "blocked", friendshipId: friendship.id };
    }

    return { status: "none" };
  },

  async getFriends(userId: string): Promise<UserWithProfile[]> {
    // Use a simpler approach to avoid relationship issues
    const { data: friendships, error } = await supabase
      .from("friendships")
      .select("user_one_id, user_two_id")
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;

    if (!friendships || friendships.length === 0) return [];

    // Get friend IDs
    const friendIds = friendships.map(friendship => 
      friendship.user_one_id === userId ? friendship.user_two_id : friendship.user_one_id
    );

    // Fetch friend profiles separately
    const { data: friends, error: friendsError } = await supabase
      .from("users")
      .select("*")
      .in("id", friendIds);

    if (friendsError) throw friendsError;

    return friends as UserWithProfile[];
  },

  async getPendingRequests(): Promise<UserWithProfile[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return [];

    // Get pending requests where current user is the receiver
    const { data: friendships, error } = await supabase
      .from("friendships")
      .select("action_user_id")
      .or(`user_one_id.eq.${currentUser.id},user_two_id.eq.${currentUser.id}`)
      .eq("status", "pending")
      .neq("action_user_id", currentUser.id);

    if (error) throw error;

    if (!friendships || friendships.length === 0) return [];

    // Get requester IDs
    const requesterIds = friendships.map(f => f.action_user_id);

    // Fetch requester profiles separately
    const { data: requesters, error: requestersError } = await supabase
      .from("users")
      .select("*")
      .in("id", requesterIds);

    if (requestersError) throw requestersError;

    return requesters as UserWithProfile[];
  },

  async getFriendsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;
    return count || 0;
  },

  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Start a transaction-like cleanup process
      // Note: Supabase doesn't support full transactions, so we'll do cascading deletes
      
      // 1. Delete all user's ratings
      const { error: ratingsError } = await supabase
        .from("ratings")
        .delete()
        .eq("user_id", userId);
      
      if (ratingsError) {
        console.error("Error deleting ratings:", ratingsError);
        throw new Error("Failed to delete user ratings");
      }

      // 2. Delete all user's comments  
      const { error: commentsError } = await supabase
        .from("comments")
        .delete()
        .eq("user_id", userId);
      
      if (commentsError) {
        console.error("Error deleting comments:", commentsError);
        throw new Error("Failed to delete user comments");
      }

      // 3. Delete all user's likes
      const { error: likesError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId);
      
      if (likesError) {
        console.error("Error deleting likes:", likesError);
        throw new Error("Failed to delete user likes");
      }

      // 4. Delete all friendships where user is involved
      const { error: friendshipsError } = await supabase
        .from("friendships")
        .delete()
        .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);
      
      if (friendshipsError) {
        console.error("Error deleting friendships:", friendshipsError);
        throw new Error("Failed to delete user friendships");
      }

      // 5. Delete user preferences
      const { error: preferencesError } = await supabase
        .from("user_preferences")
        .delete()
        .eq("user_id", userId);
      
      if (preferencesError) {
        console.error("Error deleting preferences:", preferencesError);
        // Don't throw here as preferences might not exist
      }

      // 6. Delete profile image from storage if it exists
      const user = await this.getUserProfile(userId);
      if (user?.profile_image_url) {
        try {
          const url = new URL(user.profile_image_url);
          const pathParts = url.pathname.split('/');
          const filePath = pathParts.slice(-2).join('/');
          
          await supabase.storage
            .from('profile-images')
            .remove([filePath]);
        } catch (storageError) {
          console.warn("Could not delete profile image:", storageError);
          // Don't fail the whole process for storage cleanup
        }
      }

      // 7. Delete the user profile record
      const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);
      
      if (userError) {
        console.error("Error deleting user profile:", userError);
        throw new Error("Failed to delete user profile");
      }

      // 8. Finally, delete the auth user (this should be last)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error("Error deleting auth user:", authError);
        // Note: This might fail if we don't have admin privileges
        // In that case, we'll rely on the user profile deletion
      }

    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  }
};

export default userService;