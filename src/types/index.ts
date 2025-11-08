
import type { Database } from "@/integrations/supabase/types";

// Supabase database types
export type User = Database['public']['Tables']['users']['Row'];
export type CoffeeBean = Database['public']['Tables']['coffee_beans']['Row'];
export type Rating = Database['public']['Tables']['ratings']['Row'];
export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export type UserWithProfile = UserProfile & {
  friendship_id?: string;
};

export type FriendshipStatus = {
  status: "none" | "accepted" | "pending_sent" | "pending_received";
  friendshipId?: string | null;
};

export type RatingWithDetails = Rating & {
  users: UserProfile;
  coffee_beans: CoffeeBean;
  likes: { count: number };
  comments: { count: number };
};

export type CommentWithUser = Comment & {
  users: UserProfile;
};

export interface CoffeeBeanWithRatings extends CoffeeBean {
  ratings: Array<{
    id: string;
    overall_rating: number;
    user_id: string;
  }>;
  avg_rating?: number;
  rating_count?: number;
  averageRating?: number;
  totalRatings?: number;
}

export interface Comment {
  id: string;
  user_id: string;
  rating_id: string;
  text: string;
  created_at: string;
  users: {
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
  } | null;
}

export interface Like {
  id: string;
  user_id: string;
  rating_id: string;
  created_at: string;
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