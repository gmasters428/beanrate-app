
import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/database.types";

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

export const ratingsService = {
  async getRatings(limit = 20): Promise<RatingWithDetails[]> {
    try {
      const { data, error } = await supabase
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
        .limit(limit);

      if (error) {
        console.error('Error fetching ratings:', error);
        throw error;
      }
      
      return data as RatingWithDetails[];
    } catch (error) {
      console.error('Service error in getRatings:', error);
      throw error;
    }
  },

  async getRatingsByUser(userId: string): Promise<RatingWithDetails[]> {
    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ratings by user:', error);
        throw error;
      }
      
      return data as RatingWithDetails[];
    } catch (error) {
      console.error('Service error in getRatingsByUser:', error);
      throw error;
    }
  },

  async getRatingById(id: string): Promise<RatingWithDetails | null> {
    try {
      const { data, error } = await supabase
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
        .maybeSingle();

      if (error) {
        console.error('Error fetching rating by ID:', error);
        throw error;
      }
      
      return data as RatingWithDetails | null;
    } catch (error) {
      console.error('Service error in getRatingById:', error);
      throw error;
    }
  },

  async createRating(rating: RatingInsert): Promise<Rating> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert([rating])
        .select()
        .single();

      if (error) {
        console.error('Rating creation error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Service error in createRating:', error);
      throw error;
    }
  },

  async updateRating(id: string, updates: RatingUpdate): Promise<Rating> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating rating:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Service error in updateRating:', error);
      throw error;
    }
  },

  async deleteRating(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting rating:', error);
        throw error;
      }
    } catch (error) {
      console.error('Service error in deleteRating:', error);
      throw error;
    }
  },

  async getRatingsByBean(beanId: string): Promise<RatingWithDetails[]> {
    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ratings by bean:', error);
        throw error;
      }
      
      return data as RatingWithDetails[];
    } catch (error) {
      console.error('Service error in getRatingsByBean:', error);
      throw error;
    }
  }
};

export default ratingsService;
