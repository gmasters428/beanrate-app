export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      coffee_beans: {
        Row: {
          id: string
          name: string
          brand: string
          origin: string | null
          roast_level: string | null
          flavor_notes: string[] | null
          description: string | null
          image_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          brand: string
          origin?: string | null
          roast_level?: string | null
          flavor_notes?: string[] | null
          description?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          brand?: string
          origin?: string | null
          roast_level?: string | null
          flavor_notes?: string[] | null
          description?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          rating_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rating_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rating_id?: string
          text?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string | null
          following_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          follower_id?: string | null
          following_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          follower_id?: string | null
          following_id?: string | null
          created_at?: string | null
        }
      }
      ratings: {
        Row: {
          id: string
          user_id: string | null
          coffee_bean_id: string | null
          overall_rating: number
          aroma_rating: number | null
          flavor_rating: number | null
          aftertaste_rating: number | null
          acidity_rating: number | null
          body_rating: number | null
          sweetness_rating: number | null
          balance_rating: number | null
          review_text: string | null
          brewing_method: string | null
          grinder: string | null
          grind_size: string | null
          water_temp: number | null
          brew_ratio: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          coffee_bean_id?: string | null
          overall_rating: number
          aroma_rating?: number | null
          flavor_rating?: number | null
          aftertaste_rating?: number | null
          acidity_rating?: number | null
          body_rating?: number | null
          sweetness_rating?: number | null
          balance_rating?: number | null
          review_text?: string | null
          brewing_method?: string | null
          grinder?: string | null
          grind_size?: string | null
          water_temp?: number | null
          brew_ratio?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          coffee_bean_id?: string | null
          overall_rating?: number
          aroma_rating?: number | null
          flavor_rating?: number | null
          aftertaste_rating?: number | null
          acidity_rating?: number | null
          body_rating?: number | null
          sweetness_rating?: number | null
          balance_rating?: number | null
          review_text?: string | null
          brewing_method?: string | null
          grinder?: string | null
          grind_size?: string | null
          water_temp?: number | null
          brew_ratio?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string | null
          first_name: string | null
          last_name: string | null
          region: string | null
          coffee_types: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          first_name?: string | null
          last_name?: string | null
          region?: string | null
          coffee_types?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          first_name?: string | null
          last_name?: string | null
          region?: string | null
          coffee_types?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          profile_image_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          bio?: string | null
          profile_image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          bio?: string | null
          profile_image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}