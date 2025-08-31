
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
}

export const commentsService = {
  async getCommentsByRating(ratingId: string): Promise<CommentWithUser[]> {
    try {
      // First, let's try a simple connection test
      const { data: testData, error: testError } = await supabase
        .from('comments')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Connection test failed:', testError);
        throw testError;
      }

      // Now try the main query with the relationship
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users (
            username,
            display_name,
            profile_image_url
          )
        `)
        .eq('rating_id', ratingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Comments query failed:', error);
        // If the relationship query fails, fall back to a manual join approach
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('rating_id', ratingId)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;

        // Get user data separately for each comment
        const commentsWithUsers = await Promise.all(
          commentsData.map(async (comment) => {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('username, display_name, profile_image_url')
              .eq('id', comment.user_id)
              .single();

            return {
              ...comment,
              users: userError ? null : userData
            } as CommentWithUser;
          })
        );

        return commentsWithUsers;
      }

      return data as CommentWithUser[];
    } catch (error) {
      console.error('Error in getCommentsByRating:', error);
      throw error;
    }
  },

  async createComment(comment: CommentInsert): Promise<CommentWithUser> {
    try {
      // Insert the comment first
      const { data, error } = await supabase
        .from('comments')
        .insert([comment])
        .select('*')
        .single();

      if (error) throw error;

      // Get the user data separately to ensure we have it
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, display_name, profile_image_url')
        .eq('id', data.user_id)
        .single();

      return {
        ...data,
        users: userError ? null : userData
      } as CommentWithUser;
    } catch (error) {
      console.error('Error in createComment:', error);
      throw error;
    }
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
