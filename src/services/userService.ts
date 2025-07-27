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

      // Generate unique filename - Fixed path structure
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      // Remove the nested folder structure - just use the filename
      const filePath = fileName;

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

      // Extract file path from URL - Fixed to handle the correct path structure
      const url = new URL(user.profile_image_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1]; // Get just the filename

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-images')
        .remove([fileName]);

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
      .or(`and(user_one_id.eq.${currentUser.id},user_two_id.eq.${otherUserId}),and(user_one_id.eq.${otherUserId},user_two_id.eq.${currentUser.id})`)
      .single();

    if (error || !data) return { status: "none" };

    if (data.status === "accepted") {
      return { status: "accepted", friendshipId: data.id };
    }

    if (data.status === "pending") {
      if (data.action_user_id === currentUser.id) {
        return { status: "pending_sent", friendshipId: data.id };
      } else {
        return { status: "pending_received", friendshipId: data.id };
      }
    }

    if (data.status === "blocked") {
      return { status: "blocked", friendshipId: data.id };
    }

    return { status: "none" };
  },

  async getFriends(userId: string): Promise<UserWithProfile[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        user_one_id,
        user_two_id,
        user_one:users!friendships_user_one_id_fkey(*),
        user_two:users!friendships_user_two_id_fkey(*)
      `)
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;

    const friends = data?.map(friendship => {
        const friend = friendship.user_one_id === userId ? friendship.user_two : friendship.user_one;
        return friend;
    }).filter(Boolean);

    return friends as unknown as UserWithProfile[];
  },

  async getPendingRequests(): Promise<UserWithProfile[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return [];

    const { data, error } = await supabase
      .from("friendships")
      .select(`
        action_user_id,
        requester:users!friendships_action_user_id_fkey(*)
      `)
      .or(`user_one_id.eq.${currentUser.id},user_two_id.eq.${currentUser.id}`)
      .eq("status", "pending")
      .neq("action_user_id", currentUser.id);

    if (error) throw error;

    const requests = data?.map(request => request.requester).filter(Boolean);
    return requests as unknown as UserWithProfile[];
  },

  async getFriendsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;
    return count || 0;
  }
};

export default userService;
