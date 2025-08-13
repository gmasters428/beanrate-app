
import type { Database } from "@/integrations/supabase/types";

// Supabase database types
export type User = Database['public']['Tables']['users']['Row'];
export type CoffeeBean = Database['public']['Tables']['coffee_beans']['Row'];
export type Rating = Database['public']['Tables']['ratings']['Row'];

// Extended types with relations for display
export interface UserProfile extends User {
  friend_count?: number;
  rating_count?: number;
  following?: boolean;
}

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

export interface CoffeeBeanWithRatings extends CoffeeBean {
  ratings?: RatingWithDetails[];
  average_rating?: number;
  rating_count?: number;
}

// Form types
export interface CreateRatingData {
  coffee_bean_id: string;
  overall_rating: number;
  aroma_rating?: number;
  flavor_rating?: number;
  aftertaste_rating?: number;
  acidity_rating?: number;
  body_rating?: number;
  brewing_method?: string;
  grinder?: string;
  grind_size?: string;
  review_text?: string;
}

export interface CreateCoffeeBeanData {
  name: string;
  brand: string;
  origin?: string;
  roast_level?: string;
  description?: string;
  flavor_notes?: string[];
}