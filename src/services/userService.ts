<![CDATA[
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { UserProfile, FriendshipStatus } from "@/types";

// Connection management
const activeRequests = new Map<string, AbortController>();

// Timeout helper
const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Request timeout - please check your connection"));
    }, timeoutMs);
  });
};

// Query executor with timeout and cancellation
const executeWithTimeout = async <T>(
  queryPromise: Promise<T>,
  requestKey: string,
  timeoutMs: number = 8000
): Promise<T> => {
  if (activeRequests.has(requestKey)) {
    activeRequests.get(requestKey)?.abort();
  }
  const controller = new AbortController();
  activeRequests.set(requestKey, controller);

  try {
    const result = await Promise.race([queryPromise, createTimeoutPromise(timeoutMs)]);
    activeRequests.delete(requestKey);
    return result;
  } catch (error) {
    activeRequests.delete(requestKey);
    if (controller.signal.aborted) {
      throw new Error("Request cancelled");
    }
    throw error;
  }
};

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const requestKey = `getUserProfile_${userId}`;
    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const requestKey = `updateUserProfile_${userId}`;
    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  async createUserProfile(userId: string, email: string): Promise<UserProfile> {
    const requestKey = `createUserProfile_${userId}`;
    const queryPromise = (async () => {
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
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  async uploadProfileImage(userId: string, file: File): Promise<string> {
    const requestKey = `uploadProfileImage_${userId}`;
    const queryPromise = (async () => {
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
    })();

    return executeWithTimeout(queryPromise, requestKey, 15000); // 15s timeout for uploads
  },

  async searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
    const requestKey = `searchUsers_${query}`;
    const queryPromise = (async () => {
      if (!query) return [];
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .not("id", "eq", currentUserId)
        .limit(10);
      if (error) throw error;
      return data;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  // FRIENDS
  async getFriendshipStatus(currentUserId: string, profileUserId: string): Promise<FriendshipStatus> {
    const requestKey = `getFriendshipStatus_${currentUserId}_${profileUserId}`;
    if (currentUserId === profileUserId) {
        return { status: "none", friendshipId: null };
    }
    const queryPromise = (async () => {
        const { data, error } = await supabase
            .from("friendships")
            .select("*")
            .or(`(user_one_id.eq.${currentUserId},user_two_id.eq.${profileUserId}),(user_one_id.eq.${profileUserId},user_two_id.eq.${currentUserId})`)
            .maybeSingle();
        
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
    })();
    return executeWithTimeout(queryPromise, requestKey);
},


  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<any> {
    const requestKey = `sendFriendRequest_${fromUserId}_${toUserId}`;
    const queryPromise = (async () => {
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
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  async acceptFriendRequest(friendshipId: string, currentUserId: string): Promise<any> {
    const requestKey = `acceptFriendRequest_${friendshipId}`;
    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from("friendships")
        .update({ status: "accepted", action_user_id: currentUserId })
        .eq("id", friendshipId)
        .select()
        .single();
      if (error) throw error;
      return data;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  async removeFriend(friendshipId: string): Promise<any> {
    const requestKey = `removeFriend_${friendshipId}`;
    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
      return data;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  async getFriends(userId: string): Promise<any[]> {
    const requestKey = `getFriends_${userId}`;
    const queryPromise = (async () => {
      const { data, error } = await supabase.rpc("get_friends", { p_user_id: userId });
      if (error) throw error;
      return data;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  async getFriendRequests(userId: string): Promise<any[]> {
    const requestKey = `getFriendRequests_${userId}`;
    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("*, user_one:users!user_one_id(*)")
        .eq("user_two_id", userId)
        .eq("status", "pending");
      if (error) throw error;
      return data;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },
    
  async getFollowerCount(userId: string): Promise<number> {
    const requestKey = `getFollowerCount_${userId}`;
    const queryPromise = (async () => {
        const { count, error } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .eq('user_two_id', userId)
            .eq('status', 'accepted');
        if (error) throw error;
        return count ?? 0;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },
  
  async getFollowingCount(userId: string): Promise<number> {
    const requestKey = `getFollowingCount_${userId}`;
    const queryPromise = (async () => {
        const { count, error } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .eq('user_one_id', userId)
            .eq('status', 'accepted');
        if (error) throw error;
        return count ?? 0;
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },
    
  async deleteUserAccount(userId: string): Promise<void> {
    const requestKey = `deleteUserAccount_${userId}`;
    const queryPromise = (async () => {
        const { error } = await supabase.rpc('delete_user_account', { p_user_id: userId });
        if (error) {
            console.error("Error from RPC:", error);
            throw error;
        }
    })();
    return executeWithTimeout(queryPromise, requestKey);
  },

  cancelAllRequests() {
    activeRequests.forEach((c) => c.abort());
    activeRequests.clear();
  },
};

export default userService;
]]>