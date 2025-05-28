import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CoffeeBean = Database['public']['Tables']['coffee_beans']['Row'];
type CoffeeBeanInsert = Database['public']['Tables']['coffee_beans']['Insert'];
type CoffeeBeanUpdate = Database['public']['Tables']['coffee_beans']['Update'];

export interface CoffeeBeanWithRatings extends CoffeeBean {
  ratings: Array<{
    id: string;
    overall_rating: number;
    user_id: string;
  }>;
  averageRating?: number;
  totalRatings?: number;
}

export const coffeeBeansService = {
  async getCoffeeBeans(limit = 50): Promise<CoffeeBeanWithRatings[]> {
    const { data, error } = await supabase
      .from('coffee_beans')
      .select(`
        *,
        ratings (
          id,
          overall_rating,
          user_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(bean => ({
      ...bean,
      averageRating: bean.ratings.length > 0 
        ? bean.ratings.reduce((sum, r) => sum + r.overall_rating, 0) / bean.ratings.length 
        : 0,
      totalRatings: bean.ratings.length
    })) as CoffeeBeanWithRatings[];
  },

  async getCoffeeBeanById(id: string): Promise<CoffeeBeanWithRatings | null> {
    const { data, error } = await supabase
      .from('coffee_beans')
      .select(`
        *,
        ratings (
          id,
          overall_rating,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      averageRating: data.ratings.length > 0 
        ? data.ratings.reduce((sum, r) => sum + r.overall_rating, 0) / data.ratings.length 
        : 0,
      totalRatings: data.ratings.length
    } as CoffeeBeanWithRatings;
  },

  async searchCoffeeBeans(query: string): Promise<CoffeeBeanWithRatings[]> {
    const { data, error } = await supabase
      .from('coffee_beans')
      .select(`
        *,
        ratings (
          id,
          overall_rating,
          user_id
        )
      `)
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,origin.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(bean => ({
      ...bean,
      averageRating: bean.ratings.length > 0 
        ? bean.ratings.reduce((sum, r) => sum + r.overall_rating, 0) / bean.ratings.length 
        : 0,
      totalRatings: bean.ratings.length
    })) as CoffeeBeanWithRatings[];
  },

  async createCoffeeBean(bean: CoffeeBeanInsert): Promise<CoffeeBean> {
    const { data, error } = await supabase
      .from('coffee_beans')
      .insert([bean])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCoffeeBean(id: string, updates: CoffeeBeanUpdate): Promise<CoffeeBean> {
    const { data, error } = await supabase
      .from('coffee_beans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default coffeeBeansService;