<![CDATA[
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
    
    const queryPromise = (async () => {
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
    })();

    return executeWithTimeout(queryPromise, requestKey);
  },

  async getCoffeeBeanById(id: string): Promise<CoffeeBeanWithRatings | null> {
    const requestKey = `getCoffeeBeanById_${id}`;
    
    const queryPromise = (async () => {
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
            if (error.code === 'PGRST116') { // PostgREST error for no rows found
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
    })();

    return executeWithTimeout(queryPromise, requestKey);
  },

  async searchCoffeeBeans(query: string): Promise<CoffeeBeanWithRatings[]> {
    const requestKey = `searchCoffeeBeans_${query}`;
    
    const queryPromise = (async () => {
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
    })();

    return executeWithTimeout(queryPromise, requestKey);
  },
  
  async createCoffeeBean(bean: CoffeeBeanInsert, imageFile?: File | null): Promise<CoffeeBean> {
    const requestKey = `createCoffeeBean_${Date.now()}`;
    
    const queryPromise = (async () => {
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
    })();

    return executeWithTimeout(queryPromise, requestKey, 15000);
  },

  async updateCoffeeBean(id: string, updates: CoffeeBeanUpdate, imageFile?: File | null): Promise<CoffeeBean> {
    const requestKey = `updateCoffeeBean_${id}`;
    
    const queryPromise = (async () => {
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
    })();

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
]]>