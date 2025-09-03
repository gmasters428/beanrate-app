
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Rating = Database['public']['Tables']['ratings']['Row'];
type RatingInsert = Database['public']['Tables']['ratings']['Insert'];
type RatingUpdate = Database['public']['Tables']['ratings']['Update'];

export interface RatingWithDetails extends Rating {
  users: {
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
  } | null;
  coffee_beans: {
    name: string;
    brand: string;
    origin: string | null;
    roast_level: string | null;
    variety: string | null;
    image_url: string | null;
  } | null;
}

// Connection management - track active requests
const activeRequests = new Map<string, AbortController>();

// Helper function to create timeout promise with proper cleanup
const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
  return new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout - please check your connection'));
    }, timeoutMs);
    
    // Store timeout ID for potential cleanup
    return timeoutId;
  });
};

// Helper function to execute query with timeout and cancellation
const executeWithTimeout = async <T>(
  queryPromise: Promise<T>,
  requestKey: string,
  timeoutMs: number = 8000
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

export const ratingsService = {
  async getRatings(limit = 20): Promise<RatingWithDetails[]> {
    const requestKey = `getRatings_${limit}`;
    
    const queryPromise = supabase
      .from('ratings')
      .select(`
        *,
        users!fk_ratings_user_id (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          variety,
          image_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) throw error;
        return data as RatingWithDetails[];
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async getRatingsByUser(userId: string): Promise<RatingWithDetails[]> {
    const requestKey = `getRatingsByUser_${userId}`;
    
    const queryPromise = supabase
      .from('ratings')
      .select(`
        *,
        users!fk_ratings_user_id (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          variety,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data as RatingWithDetails[];
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async getRatingById(id: string): Promise<RatingWithDetails | null> {
    const requestKey = `getRatingById_${id}`;
    
    const queryPromise = supabase
      .from('ratings')
      .select(`
        *,
        users!fk_ratings_user_id (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          variety,
          image_url
        )
      `)
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching rating by ID:', error);
          throw error;
        }
        return data as RatingWithDetails | null;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async createRating(rating: RatingInsert): Promise<Rating> {
    const requestKey = `createRating_${Date.now()}`;
    
    console.log('Creating rating with data:', rating);
    
    const queryPromise = supabase
      .from('ratings')
      .insert([rating])
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Rating creation error:', error);
          throw error;
        }
        
        console.log('Rating created successfully:', data);
        return data;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async updateRating(id: string, updates: RatingUpdate): Promise<Rating> {
    const requestKey = `updateRating_${id}`;
    
    const queryPromise = supabase
      .from('ratings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async deleteRating(id: string): Promise<void> {
    const requestKey = `deleteRating_${id}`;
    
    const queryPromise = supabase
      .from('ratings')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) throw error;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async getRatingsByBean(beanId: string): Promise<RatingWithDetails[]> {
    const requestKey = `getRatingsByBean_${beanId}`;
    
    const queryPromise = supabase
      .from('ratings')
      .select(`
        *,
        users!fk_ratings_user_id (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          variety,
          image_url
        )
      `)
      .eq('coffee_bean_id', beanId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data as RatingWithDetails[];
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

export default ratingsService;
