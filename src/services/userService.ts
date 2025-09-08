<![CDATA[
import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/types";
import { type UserProfile, type FriendshipStatus } from "@/types";

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

  async createUserProfile(userId: string, email: string): Promise<UserProfile> {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingUser) {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
      if (error) throw error;
      return data as UserProfile;
    }

    const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_");
    const { data, error } = await supabase
      .from("users")
      .insert({ id: userId, username, display_name: username })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async uploadProfileImage(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("images")
      .upload(`profiles/${fileName}`, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(data.path);
    
    await userService.updateUserProfile(userId, { profile_image_url: publicUrl });

    return publicUrl;
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
    
    const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .or(`(user_one_id.eq.${currentUserId},user_two_id.eq.${profileUserId}),(user_one_id.eq.${profileUserId},user_two_id.eq.${currentUserId})`)
        .maybeSingle(); // Use maybeSingle to handle zero rows gracefully
    
    if (error) {
        console.error("Error fetching friendship status:", error);
        throw error;
    }

    if (!data) {
        return { status: "none", friendshipId: null };
    }

    if (data.status === "accepted") {
        return { status: "accepted", friendshipId: data.id };
    }

    if (data.status === "pending") {
        if (data.action_user_id === currentUserId) {
            return { status: "pending_sent", friendshipId: data.id };
        } else {
            return { status: "pending_received", friendshipId: data.id };
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

  async getFriends(userId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc("get_friends", { p_user_id: userId });
    if (error) throw error;
    return data;
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
};

export default userService;
]]>