import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/types";

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
  async getCoffeeBeansWithRatings(limit = 50): Promise<CoffeeBeanWithRatings[]> {
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
            ? bean.ratings.reduce((sum, r) => sum + Number(r.overall_rating), 0) / bean.ratings.length 
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

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        throw error;
    }
    
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
        .or(
            `name.ilike.%${query}%,` +
            `brand.ilike.%${query}%,` +
            `origin.ilike.%${query}%,` +
            `region.ilike.%${query}%,` +
            `description.ilike.%${query}%`
        )
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

    if (imageFile) {
        try {
            if (imageFile.type.startsWith('image/') && imageFile.size <= 10 * 1024 * 1024) {
                const fileExt = imageFile.name.split('.').pop() || 'jpg';
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `coffee-beans/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, imageFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.warn('Image upload failed (non-critical):', uploadError.message);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('images')
                        .getPublicUrl(filePath);
                    imageUrl = publicUrl;
                }
            }
        } catch (error) {
            console.warn('Image upload error caught and ignored:', error);
        }
    }
    
    const beanData = { ...bean, image_url: imageUrl };

    const { data, error } = await supabase
        .from('coffee_beans')
        .insert([beanData])
        .select()
        .single();

    if (error) {
        console.error('Coffee bean creation failed:', error);
        throw new Error(`Database insertion failed: ${error.message}`);
    }
    
    return data;
  },

  async updateCoffeeBean(id: string, updates: CoffeeBeanUpdate, imageFile?: File | null): Promise<CoffeeBean> {
    let updateData = { ...updates };

    if (imageFile) {
        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `coffee-beans/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.warn('Image upload failed during update, continuing without image');
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);
                updateData.image_url = publicUrl;
            }
        } catch (error) {
            console.warn('Image upload error during update:', error);
        }
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