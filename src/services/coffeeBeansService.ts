
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
      avg_rating: bean.ratings.length > 0 
        ? bean.ratings.reduce((sum, r) => sum + Number(r.overall_rating), 0) / bean.ratings.length 
        : 0,
      rating_count: bean.ratings.length,
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

  // COMPLETELY NON-BLOCKING IMAGE UPLOAD - Fixed implementation
  async createCoffeeBean(bean: CoffeeBeanInsert, imageFile?: File | null): Promise<CoffeeBean> {
    console.log('🚀 Starting coffee bean creation process...');
    console.log('📝 Bean data:', bean);
    console.log('🖼️ Image file provided:', imageFile ? `Yes (${imageFile.name}, ${imageFile.size} bytes)` : 'No');

    let imageUrl = null;

    // IMAGE UPLOAD - COMPLETELY OPTIONAL AND NON-BLOCKING
    if (imageFile) {
      console.log('🖼️ Attempting image upload (non-critical)...');
      
      try {
        // Validate file
        if (!imageFile.type.startsWith('image/')) {
          console.warn('⚠️ Invalid file type, skipping image upload');
        } else if (imageFile.size > 10 * 1024 * 1024) {
          console.warn('⚠️ File too large, skipping image upload');
        } else {
          // Proceed with upload
          const fileExt = imageFile.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `coffee-beans/${fileName}`;

          console.log('📁 Uploading to path:', filePath);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.warn('⚠️ Image upload failed (non-critical):', uploadError.message);
            console.log('📄 Proceeding without image - bean creation will continue normally');
            // Explicitly NOT throwing error - this is non-blocking
          } else {
            console.log('✅ Image uploaded successfully:', uploadData);
            
            // Get public URL only if upload succeeded
            const { data: { publicUrl } } = supabase.storage
              .from('images')
              .getPublicUrl(filePath);

            imageUrl = publicUrl;
            console.log('🔗 Public URL generated:', publicUrl);
          }
        }
      } catch (error) {
        // CRITICAL: Catch all image upload errors and continue
        console.warn('⚠️ Image upload error caught and ignored (non-critical):', error);
        console.log('📄 Continuing with bean creation without image');
        // Explicitly NOT re-throwing - image upload failure should NEVER block bean creation
      }
    } else {
      console.log('📝 No image provided - creating bean without image');
    }

    // CORE BEAN CREATION - This is the critical part that MUST succeed
    console.log('☕ Creating coffee bean in database...');
    
    const beanData = {
      ...bean,
      image_url: imageUrl, // Will be null if image upload failed or was skipped
    };

    console.log('💾 Final bean data to insert:', beanData);

    try {
      const { data, error } = await supabase
        .from('coffee_beans')
        .insert([beanData])
        .select()
        .single();

      if (error) {
        console.error('❌ Coffee bean creation failed:', error);
        throw new Error(`Database insertion failed: ${error.message}`);
      }
      
      console.log('✅ Coffee bean created successfully:', data);
      return data;
      
    } catch (dbError) {
      console.error('💥 Database error during bean creation:', dbError);
      throw dbError; // This error SHOULD be thrown as it's critical
    }
  },

  async updateCoffeeBean(id: string, updates: CoffeeBeanUpdate, imageFile?: File | null): Promise<CoffeeBean> {
    let updateData = { ...updates };

    // Upload new image if provided
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
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

          updateData.image_url = publicUrl;
        }
      } catch (error) {
        console.warn('Image upload error during update, continuing without image:', error);
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