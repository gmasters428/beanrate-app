
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

// Connection management - track active requests
const activeRequests = new Map<string, AbortController>();

// Helper function to create timeout promise with proper cleanup
const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
  return new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout - please check your connection'));
    }, timeoutMs);
    
    return timeoutId;
  });
};

// Helper function to execute query with timeout and cancellation
const executeWithTimeout = async <T>(
  queryPromise: Promise<T>,
  requestKey: string,
  timeoutMs: number = 8000
): Promise<T> => {
  // Cancel any existing request with the same key
  if (activeRequests.has(requestKey)) {
    activeRequests.get(requestKey)?.abort();
  }

  // Create new abort controller for this request
  const abortController = new AbortController();
  activeRequests.set(requestKey, abortController);

  try {
    const timeoutPromise = createTimeoutPromise(timeoutMs);
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    // Clean up successful request
    activeRequests.delete(requestKey);
    return result;
  } catch (error) {
    // Clean up failed request
    activeRequests.delete(requestKey);
    
    // Don't throw if request was aborted (component unmounted)
    if (abortController.signal.aborted) {
      throw new Error('Request cancelled');
    }
    
    throw error;
  }
};

export const coffeeBeansService = {
  async getCoffeeBeansWithRatings(limit = 50): Promise<CoffeeBeanWithRatings[]> {
    const requestKey = `getCoffeeBeansWithRatings_${limit}`;
    
    const queryPromise = supabase
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
      .limit(limit)
      .then(({ data, error }) => {
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
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async getCoffeeBeanById(id: string): Promise<CoffeeBeanWithRatings | null> {
    const requestKey = `getCoffeeBeanById_${id}`;
    
    const queryPromise = supabase
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
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        
        if (!data) return null;

        return {
          ...data,
          averageRating: data.ratings.length > 0 
            ? data.ratings.reduce((sum, r) => sum + r.overall_rating, 0) / data.ratings.length 
            : 0,
          totalRatings: data.ratings.length
        } as CoffeeBeanWithRatings;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  async searchCoffeeBeans(query: string): Promise<CoffeeBeanWithRatings[]> {
    const requestKey = `searchCoffeeBeans_${query}`;
    
    const queryPromise = supabase
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
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        
        return data.map(bean => ({
          ...bean,
          averageRating: bean.ratings.length > 0 
            ? bean.ratings.reduce((sum, r) => sum + r.overall_rating, 0) / bean.ratings.length 
            : 0,
          totalRatings: bean.ratings.length
        })) as CoffeeBeanWithRatings[];
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  // COMPLETELY NON-BLOCKING IMAGE UPLOAD with timeout protection
  async createCoffeeBean(bean: CoffeeBeanInsert, imageFile?: File | null): Promise<CoffeeBean> {
    const requestKey = `createCoffeeBean_${Date.now()}`;
    
    console.log('🚀 Starting coffee bean creation process...');
    console.log('📝 Bean data:', bean);
    console.log('🖼️ Image file provided:', imageFile ? `Yes (${imageFile.name}, ${imageFile.size} bytes)` : 'No');

    let imageUrl = null;

    // IMAGE UPLOAD - COMPLETELY OPTIONAL AND NON-BLOCKING with timeout
    if (imageFile) {
      console.log('🖼️ Attempting image upload (non-critical)...');
      
      try {
        // Validate file
        if (!imageFile.type.startsWith('image/')) {
          console.warn('⚠️ Invalid file type, skipping image upload');
        } else if (imageFile.size > 10 * 1024 * 1024) {
          console.warn('⚠️ File too large, skipping image upload');
        } else {
          // Proceed with upload with timeout protection
          const fileExt = imageFile.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `coffee-beans/${fileName}`;

          console.log('📁 Uploading to path:', filePath);

          // Add timeout for image upload (shorter timeout for images)
          const uploadTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Image upload timeout'));
            }, 15000); // 15 second timeout for image upload
          });

          const uploadPromise = supabase.storage
            .from('images')
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: false
            });

          const { data: uploadData, error: uploadError } = await Promise.race([
            uploadPromise,
            uploadTimeout
          ]);

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

    // CORE BEAN CREATION - This is the critical part that MUST succeed with timeout protection
    console.log('☕ Creating coffee bean in database...');
    
    const beanData = {
      ...bean,
      image_url: imageUrl, // Will be null if image upload failed or was skipped
    };

    console.log('💾 Final bean data to insert:', beanData);

    const queryPromise = supabase
      .from('coffee_beans')
      .insert([beanData])
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Coffee bean creation failed:', error);
          throw new Error(`Database insertion failed: ${error.message}`);
        }
        
        console.log('✅ Coffee bean created successfully:', data);
        return data;
      });

    return executeWithTimeout(queryPromise, requestKey, 10000); // 10 second timeout for bean creation
  },

  async updateCoffeeBean(id: string, updates: CoffeeBeanUpdate, imageFile?: File | null): Promise<CoffeeBean> {
    const requestKey = `updateCoffeeBean_${id}`;
    let updateData = { ...updates };

    // Upload new image if provided with timeout protection
    if (imageFile) {
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `coffee-beans/${fileName}`;

        // Add timeout for image upload
        const uploadTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Image upload timeout'));
          }, 15000); // 15 second timeout
        });

        const uploadPromise = supabase.storage
          .from('images')
          .upload(filePath, imageFile);

        const { error: uploadError } = await Promise.race([
          uploadPromise,
          uploadTimeout
        ]);

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

    const queryPromise = supabase
      .from('coffee_beans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });

    return executeWithTimeout(queryPromise, requestKey);
  },

  // Cleanup function to cancel all pending requests
  cancelAllRequests(): void {
    activeRequests.forEach((controller) => {
      controller.abort();
    });
    activeRequests.clear();
  },

  // Get active request count for debugging
  getActiveRequestCount(): number {
    return activeRequests.size;
  }
};

export default coffeeBeansService;
