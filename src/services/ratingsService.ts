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
    image_url: string | null;
  } | null;
}

export const ratingsService = {
  async getRatings(limit = 20): Promise<RatingWithDetails[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        users (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          image_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as RatingWithDetails[];
  },

  async getRatingsByUser(userId: string): Promise<RatingWithDetails[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        users (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RatingWithDetails[];
  },

  async getRatingById(id: string): Promise<RatingWithDetails | null> {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        users (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          image_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as RatingWithDetails;
  },

  async createRating(rating: RatingInsert): Promise<Rating> {
    console.log('Creating rating with data:', rating);
    
    const { data, error } = await supabase
      .from('ratings')
      .insert([rating])
      .select()
      .single();

    if (error) {
      console.error('Rating creation error:', error);
      throw error;
    }
    
    console.log('Rating created successfully:', data);
    return data;
  },

  async updateRating(id: string, updates: RatingUpdate): Promise<Rating> {
    const { data, error } = await supabase
      .from('ratings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRating(id: string): Promise<void> {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getRatingsByBean(beanId: string): Promise<RatingWithDetails[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        users (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          image_url
        )
      `)
      .eq('coffee_bean_id', beanId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RatingWithDetails[];
  }
};

export default ratingsService;