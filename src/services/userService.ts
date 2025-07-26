
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];

export interface UserWithProfile extends User {
  user_profiles: UserProfile | null;
  email: string; // Ensure email is available
}

export interface FriendshipStatus {
  status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
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
      .select(`
        id,
        email,
        user_profiles (*)
      `)
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as UserWithProfile | null;
  },

  async createUserProfile(userId: string, email: string) {
    const username = email.split('@')[0];
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: userId,
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

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  async updatePreferences(userId: string, updates: Partial<UserPreferences>) {
    const { data, error } = await supabase
      .from("user_preferences")
      .update(updates)
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  },

  async searchUsers(query: string, limit = 10): Promise<UserWithProfile[]> {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        user_profiles (*)
      `)
      .or(`email.ilike.%${query}%,user_profiles.display_name.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data as UserWithProfile[];
  },

  // Friendship functions
  async sendFriendRequest(receiverId: string) {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const existingFriendship = await this.getFriendshipStatus(receiverId);
    if (existingFriendship.status !== 'none') {
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
        status: 'pending'
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
        status: 'accepted',
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
    if (!currentUser) return { status: 'none' };

    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(user_one_id.eq.${currentUser.id},user_two_id.eq.${otherUserId}),and(user_one_id.eq.${otherUserId},user_two_id.eq.${currentUser.id})`)
      .single();

    if (error || !data) return { status: 'none' };

    if (data.status === 'accepted') {
      return { status: 'accepted', friendshipId: data.id };
    }

    if (data.status === 'pending') {
      if (data.action_user_id === currentUser.id) {
        return { status: 'pending_sent', friendshipId: data.id };
      } else {
        return { status: 'pending_received', friendshipId: data.id };
      }
    }

    if (data.status === 'blocked') {
      return { status: 'blocked', friendshipId: data.id };
    }

    return { status: 'none' };
  },

  async getFriends(userId: string): Promise<UserWithProfile[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        user_one:users!friendships_user_one_id_fkey(id, email, user_profiles(*)),
        user_two:users!friendships_user_two_id_fkey(id, email, user_profiles(*))
      `)
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;

    const friends = data?.map(friendship => 
      friendship.user_one_id === userId ? friendship.user_two : friendship.user_one
    ).filter(Boolean) || [];

    return friends as UserWithProfile[];
  },

  async getPendingRequests(): Promise<UserWithProfile[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return [];

    const { data, error } = await supabase
      .from("friendships")
      .select(`
        requester:users!friendships_action_user_id_fkey(id, email, user_profiles(*))
      `)
      .or(`user_one_id.eq.${currentUser.id},user_two_id.eq.${currentUser.id}`)
      .eq("status", "pending")
      .neq("action_user_id", currentUser.id);

    if (error) throw error;

    return data?.map(request => request.requester).filter(Boolean) as UserWithProfile[] || [];
  },

  async getFriendsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("friendships")
      .select("*", { count: 'exact', head: true })
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;
    return count || 0;
  }
};

export default userService;
