
import { supabase } from "@/integrations/supabase/client";

// Connection management - track active requests
const activeRequests = new Map<string, AbortController>();

// Helper function to create timeout promise with proper cleanup
const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
  return new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout - please check your connection'));
    }, timeoutMs);
    
    return timeoutId;
  });
};

// Helper function to execute query with timeout and cancellation
const executeWithTimeout = async <T>(
  queryPromise: Promise<T>,
  requestKey: string,
  timeoutMs: number = 5000
): Promise<T> => {
  // Cancel any existing request with the same key
  if (activeRequests.has(requestKey)) {
    activeRequests.get(requestKey)?.abort();
  }

  // Create new abort controller for this request
  const abortController = new AbortController();
  activeRequests.set(requestKey, abortController);

  try {
    const timeoutPromise = createTimeoutPromise(timeoutMs);
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    // Clean up successful request
    activeRequests.delete(requestKey);
    return result;
  } catch (error) {
    // Clean up failed request
    activeRequests.delete(requestKey);
    
    // Don't throw if request was aborted (component unmounted)
    if (abortController.signal.aborted) {
      throw new Error('Request cancelled');
    }
    
    throw error;
  }
};

export const likesService = {
  async getLikesByRating(ratingId: string) {
    const requestKey = `getLikesByRating_${ratingId}`;
    
    const queryPromise = supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('rating_id', ratingId)
      .then(({ data, error, count }) => {
        if (error) throw error;
        return { likes: data, count: count ?? 0 };
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async hasUserLikedRating(ratingId: string, userId: string) {
    if (!userId) return false;
    
    const requestKey = `hasUserLikedRating_${ratingId}_${userId}`;
    
    const queryPromise = supabase
      .from('likes')
      .select('id')
      .eq('rating_id', ratingId)
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) throw error;
        // Return true if any likes exist, false otherwise
        return data && data.length > 0;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async likeRating(ratingId: string, userId: string) {
    const requestKey = `likeRating_${ratingId}_${userId}`;
    
    const queryPromise = supabase
      .from('likes')
      .insert([{ rating_id: ratingId, user_id: userId }])
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async unlikeRating(ratingId: string, userId: string) {
    const requestKey = `unlikeRating_${ratingId}_${userId}`;
    
    const queryPromise = supabase
      .from('likes')
      .delete()
      .eq('rating_id', ratingId)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) throw error;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  // Cleanup function to cancel all pending requests
  cancelAllRequests(): void {
    activeRequests.forEach((controller) => {
      controller.abort();
    });
    activeRequests.clear();
  },

  // Get active request count for debugging
  getActiveRequestCount(): number {
    return activeRequests.size;
  }
};
