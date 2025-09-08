<![CDATA[
import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/types";

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

export const commentsService = {
  async getCommentsByRating(ratingId: string): Promise<CommentWithUser[]> {
    const { data, error } = await supabase
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
        .order('created_at', { ascending: true });

    if (error) throw error;
    
    const comments = data as CommentWithUser[];
    const topLevelComments: CommentWithUser[] = [];
    const commentMap = new Map<string, CommentWithUser>();

    comments.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
        if (!comment.parent_id) {
            topLevelComments.push(comment);
        }
    });

    comments.forEach(comment => {
        if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
                parent.replies!.push(comment);
            }
        }
    });
    
    topLevelComments.forEach(comment => {
      comment.reply_count = comment.replies?.length || 0;
    });

    return topLevelComments;
  },

  async createComment(comment: CommentInsert): Promise<CommentWithUser> {
    const { data, error } = await supabase
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
        .single();

    if (error) throw error;
    
    const result = data as CommentWithUser;
    result.replies = [];
    result.reply_count = 0;
    
    return result;
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

    if (error) throw error;
  },

  async getCommentCount(ratingId: string): Promise<number> {
    const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('rating_id', ratingId);

    if (error) throw error;
    return count || 0;
  }
};

export default commentsService;
]]>