
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export interface CommentWithUser extends Database['public']['Tables']['comments']['Row'] {
  users: {
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
  } | null;
}

export const commentsService = {
  async getCommentsByRating(ratingId: string): Promise<CommentWithUser[]> {
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

    if (error) throw error;
    return data as CommentWithUser[];
  },

  async createComment(comment: CommentInsert): Promise<CommentWithUser> {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select(`
        *,
        users (
          username,
          display_name,
          profile_image_url
        )
      `)
      .single();

    if (error) throw error;
    return data as CommentWithUser;
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
