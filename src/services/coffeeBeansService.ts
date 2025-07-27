
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

  async createCoffeeBean(bean: CoffeeBeanInsert, imageFile?: File | null): Promise<CoffeeBean> {
    let imageUrl = null;

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `coffee-beans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    // Create the coffee bean with image URL
    const beanData = {
      ...bean,
      image_url: imageUrl,
    };

    const { data, error } = await supabase
      .from('coffee_beans')
      .insert([beanData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCoffeeBean(id: string, updates: CoffeeBeanUpdate, imageFile?: File | null): Promise<CoffeeBean> {
    let updateData = { ...updates };

    // Upload new image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `coffee-beans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      updateData.image_url = publicUrl;
    }

    const { data, error } = await supabase
      .from('coffee_beans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default coffeeBeansService;
