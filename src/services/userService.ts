import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/database.types";
import { type UserProfile, type FriendshipStatus, type UserWithProfile } from "@/types";
import { getImageBucketCandidates, isBucketNotFound, parseSupabaseStorageUrl, uploadImageWithFallback } from "@/services/storageService";

export type { UserProfile, FriendshipStatus, UserWithProfile };

// Helper function to resolve avatar URL from multiple possible sources
function resolveAvatarUrl(user: any): string | null {
  // Prefer absolute URLs already stored
  if (user?.profile_image_url && /^https?:\/\//i.test(user.profile_image_url)) {
    return user.profile_image_url;
  }
  if (user?.avatar_url && /^https?:\/\//i.test(user.avatar_url)) {
    return user.avatar_url;
  }

  // If only a Storage path exists (e.g., avatars/<file>), derive public URL
  if (user?.avatar_path) {
    const { data } = supabase.storage.from('avatars').getPublicUrl(user.avatar_path);
    return data?.publicUrl ?? null;
  }
  
  return null; // caller can fall back to placeholder
}

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
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
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const { publicUrl } = await uploadImageWithFallback(`profiles/${fileName}`, file, {
      cacheControl: "3600",
      upsert: true,
    });
    
    await userService.updateUserProfile(userId, { profile_image_url: publicUrl });

    return publicUrl;
  },

  async removeProfileImage(userId: string): Promise<void> {
    // Get the current user profile to find the image URL
    const userProfile = await userService.getUserProfile(userId);
    
    if (userProfile?.profile_image_url) {
      const storageTarget = parseSupabaseStorageUrl(userProfile.profile_image_url);

      if (storageTarget) {
        const { error: storageError } = await supabase.storage
          .from(storageTarget.bucket)
          .remove([storageTarget.path]);

        if (storageError) {
          console.warn('Failed to delete image from storage:', storageError);
        }
      } else {
        const urlParts = userProfile.profile_image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `profiles/${fileName}`;

        for (const bucket of getImageBucketCandidates()) {
          const { error: storageError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

          if (!storageError) {
            break;
          }

          if (!isBucketNotFound(storageError)) {
            console.warn('Failed to delete image from storage:', storageError);
            break;
          }
        }
      }

      // Continue with profile update even if storage deletion fails
    }
    
    // Update the user profile to remove the image URL
    await userService.updateUserProfile(userId, { profile_image_url: null });
  },

  async searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
    if (!query) return [];
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .not("id", "eq", currentUserId)
      .limit(10);
    if (error) throw error;
    return data;
  },

  async getFriendshipStatus(currentUserId: string, profileUserId: string): Promise<FriendshipStatus> {
    if (currentUserId === profileUserId) {
        return { status: "none", friendshipId: null };
    }
    
    // ✅ SAFE: Use two separate queries instead of unsafe string interpolation
    const { data: friendship1, error: error1 } = await supabase
        .from("friendships")
        .select("*")
        .eq("user_one_id", currentUserId)
        .eq("user_two_id", profileUserId)
        .maybeSingle();
    
    if (error1) {
        console.error("Error fetching friendship status (query 1):", error1);
        throw error1;
    }

    if (friendship1) {
        if (friendship1.status === "accepted") {
            return { status: "accepted", friendshipId: friendship1.id };
        }
        if (friendship1.status === "pending") {
            if (friendship1.action_user_id === currentUserId) {
                return { status: "pending_sent", friendshipId: friendship1.id };
            } else {
                return { status: "pending_received", friendshipId: friendship1.id };
            }
        }
    }

    // Check the reverse relationship
    const { data: friendship2, error: error2 } = await supabase
        .from("friendships")
        .select("*")
        .eq("user_one_id", profileUserId)
        .eq("user_two_id", currentUserId)
        .maybeSingle();
    
    if (error2) {
        console.error("Error fetching friendship status (query 2):", error2);
        throw error2;
    }

    if (friendship2) {
        if (friendship2.status === "accepted") {
            return { status: "accepted", friendshipId: friendship2.id };
        }
        if (friendship2.status === "pending") {
            if (friendship2.action_user_id === currentUserId) {
                return { status: "pending_sent", friendshipId: friendship2.id };
            } else {
                return { status: "pending_received", friendshipId: friendship2.id };
            }
        }
    }
    
    return { status: "none", friendshipId: null };
  },

  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<any> {
    const { data, error } = await supabase
      .from("friendships")
      .insert({
        user_one_id: fromUserId,
        user_two_id: toUserId,
        status: "pending",
        action_user_id: fromUserId,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async acceptFriendRequest(friendshipId: string, currentUserId: string): Promise<any> {
    const { data, error } = await supabase
      .from("friendships")
      .update({ status: "accepted", action_user_id: currentUserId })
      .eq("id", friendshipId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeFriend(friendshipId: string): Promise<any> {
    const { data, error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    if (error) throw error;
    return data;
  },

  async getFriends(userId: string): Promise<UserWithProfile[]> {
    // Query friendships where current user is either user_one or user_two
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        status,
        user_one_id,
        user_two_id,
        user_one:users!user_one_id(id, username, display_name, profile_image_url, avatar_url, avatar_path),
        user_two:users!user_two_id(id, username, display_name, profile_image_url, avatar_url, avatar_path)
      `)
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;

    // Map the results to return "the other person" in the friendship
    const friends = (data ?? []).map((friendship: any) => {
      const friend = friendship.user_one_id === userId ? friendship.user_two : friendship.user_one;
      const avatarUrl = resolveAvatarUrl(friend);
      
      return {
        id: friend.id,
        username: friend.username,
        display_name: friend.display_name,
        profile_image_url: avatarUrl,
        bio: null,
        created_at: null,
        updated_at: null,
        friendship_id: friendship.id // Add friendship ID for deletion
      } as UserWithProfile;
    });

    return friends;
  },

  async getFriendRequests(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select("*, user_one:users!user_one_id(*)")
      .eq("user_two_id", userId)
      .eq("status", "pending");
    if (error) throw error;
    return data;
  },
    
  async getFollowerCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('user_two_id', userId)
        .eq('status', 'accepted');
    if (error) throw error;
    return count ?? 0;
  },
  
  async getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('user_one_id', userId)
        .eq('status', 'accepted');
    if (error) throw error;
    return count ?? 0;
  },
    
  async deleteUserAccount(userId: string): Promise<void> {
    const { error } = await supabase.rpc('delete_user_account', { p_user_id: userId });
    if (error) {
        console.error("Error from RPC:", error);
        throw error;
    }
  },

  async getFriendsCount(userId: string): Promise<number> {
    // ✅ SAFE: Use separate queries instead of unsafe string interpolation
    const { count: count1, error: error1 } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_one_id', userId)
      .eq('status', 'accepted');

    if (error1) throw error1;

    const { count: count2, error: error2 } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_two_id', userId)
      .eq('status', 'accepted');

    if (error2) throw error2;

    return (count1 ?? 0) + (count2 ?? 0);
  },

  async getPendingRequests(userId: string): Promise<any[]> {
    return this.getFriendRequests(userId);
  },

  async rejectFriendRequest(friendshipId: string): Promise<any> {
    const { data, error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    if (error) throw error;
    return data;
  },

  async updatePreferences(userId: string, preferences: any): Promise<any> {
    // For now, we'll store preferences in a separate table or as JSON in user profile
    // This is a placeholder implementation
    const { data, error } = await supabase
      .from("users")
      .update({ 
        // Store preferences as metadata for now
        bio: JSON.stringify(preferences) 
      })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
