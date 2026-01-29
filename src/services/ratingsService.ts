
import { supabase, supabasePublic } from "@/integrations/supabase/client";
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

const RATINGS_FETCH_TIMEOUT_MS = 8000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getSessionTokenWithRetry = async (attempts = 3, delayMs = 250) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      return data.session.access_token;
    }
    if (attempt < attempts - 1) {
      await delay(delayMs);
    }
  }
  return null;
};

const fetchRatingsByUserDirect = async (userId: string): Promise<RatingWithDetails[]> => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || (supabase as any)?.supabaseUrl;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (supabase as any)?.supabaseKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL or anon key missing.");
  }

  const accessToken = await getSessionTokenWithRetry();
  const url = new URL(`${supabaseUrl}/rest/v1/ratings`);
  url.searchParams.set(
    "select",
    "*,users!fk_ratings_user_id(username,display_name,profile_image_url),coffee_beans(name,brand,origin,roast_level,variety,image_url)"
  );
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("order", "created_at.desc");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RATINGS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken || supabaseKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const error = new Error(body || `Failed to load ratings (${response.status})`);
      (error as any).status = response.status;
      throw error;
    }

    const data = await response.json();
    return data as RatingWithDetails[];
  } finally {
    clearTimeout(timeoutId);
  }
};

export const ratingsService = {
  async getRatings(
    limit = 20,
    options?: { signal?: AbortSignal; usePublicClient?: boolean }
  ): Promise<RatingWithDetails[]> {
    try {
      if (options?.usePublicClient) {
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL || (supabasePublic as any)?.supabaseUrl;
        const supabaseKey =
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (supabasePublic as any)?.supabaseKey;

        if (supabaseUrl && supabaseKey) {
          const url = new URL(`${supabaseUrl}/rest/v1/ratings`);
          url.searchParams.set(
            "select",
            "*,users!fk_ratings_user_id(username,display_name,profile_image_url),coffee_beans(name,brand,origin,roast_level,variety,image_url)"
          );
          url.searchParams.set("order", "created_at.desc");
          url.searchParams.set("limit", String(limit));

          const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Accept: "application/json",
            },
            signal: options?.signal,
          });

          if (!response.ok) {
            const body = await response.text().catch(() => "");
            const error = new Error(body || `Failed to load ratings (${response.status})`);
            (error as any).status = response.status;
            throw error;
          }

          const data = await response.json();
          return data as RatingWithDetails[];
        }
      }

      const client = options?.usePublicClient ? supabasePublic : supabase;
      let query = client
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

      if (options?.signal) {
        query = query.abortSignal(options.signal);
      }

      const { data, error } = await query;

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RATINGS_FETCH_TIMEOUT_MS);

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
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      if (error) {
        console.error('Error fetching ratings by user:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('Ratings fetch returned empty data, retrying with direct REST call.');
        return await fetchRatingsByUserDirect(userId);
      }

      return data as RatingWithDetails[];
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message || "";
        if (error.name === "AbortError" || message.includes("timeout") || message.includes("Failed to fetch")) {
          console.warn("Ratings fetch failed, retrying with direct REST call.");
          return await fetchRatingsByUserDirect(userId);
        }
      }
      console.error('Service error in getRatingsByUser:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
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
