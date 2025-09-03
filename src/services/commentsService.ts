
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export interface CommentWithUser extends Comment {
  users: {
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
  } | null;
  replies?: CommentWithUser[];
  reply_count?: number;
}

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
  timeoutMs: number = 6000
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

export const commentsService = {
  async getCommentsByRating(ratingId: string): Promise<CommentWithUser[]> {
    const requestKey = `getCommentsByRating_${ratingId}`;
    
    const queryPromise = supabase
      .from('comments')
      .select(`
        *,
        users!comments_user_id_fkey (
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('rating_id', ratingId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        
        // Organize comments into threaded structure
        const comments = data as CommentWithUser[];
        const topLevelComments: CommentWithUser[] = [];
        const commentMap = new Map<string, CommentWithUser>();

        // First pass: create map and identify top-level comments
        comments.forEach(comment => {
          comment.replies = [];
          commentMap.set(comment.id, comment);
          
          if (!comment.parent_id) {
            topLevelComments.push(comment);
          }
        });

        // Second pass: organize replies under parent comments
        comments.forEach(comment => {
          if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
              parent.replies!.push(comment);
            }
          }
        });

        // Add reply count to each comment
        topLevelComments.forEach(comment => {
          comment.reply_count = comment.replies?.length || 0;
        });

        return topLevelComments;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async createComment(comment: CommentInsert): Promise<CommentWithUser> {
    const requestKey = `createComment_${Date.now()}`;
    
    const queryPromise = supabase
      .from('comments')
      .insert([comment])
      .select(`
        *,
        users!comments_user_id_fkey (
          username,
          display_name,
          profile_image_url
        )
      `)
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        
        const result = data as CommentWithUser;
        result.replies = [];
        result.reply_count = 0;
        
        return result;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async deleteComment(id: string): Promise<void> {
    const requestKey = `deleteComment_${id}`;
    
    const queryPromise = supabase
      .from('comments')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) throw error;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async getCommentCount(ratingId: string): Promise<number> {
    const requestKey = `getCommentCount_${ratingId}`;
    
    const queryPromise = supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('rating_id', ratingId)
      .then(({ count, error }) => {
        if (error) throw error;
        return count || 0;
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

export default commentsService;
