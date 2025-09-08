import { supabase } from "@/integrations/supabase/client";

export const likesService = {
  async getLikesByRating(ratingId: string): Promise<{ likes: any[], count: number }> {
    const { data, error, count } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('rating_id', ratingId);

    if (error) throw error;
    return { likes: data || [], count: count ?? 0 };
  },

  async hasUserLikedRating(ratingId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    
    const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('rating_id', ratingId)
        .eq('user_id', userId);

    if (error) throw error;
    return data && data.length > 0;
  },

  async likeRating(ratingId: string, userId: string): Promise<any> {
    const { data, error } = await supabase
        .from('likes')
        .insert([{ rating_id: ratingId, user_id: userId }])
        .select()
        .single();

    if (error) throw error;
    return data;
  },

  async unlikeRating(ratingId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('rating_id', ratingId)
        .eq('user_id', userId);
    
    if (error) throw error;
  }
};