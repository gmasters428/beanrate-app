import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const [ratings, setRatings] = useState<RatingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"following" | "trending">("trending");
  const { user } = useAuth();

  useEffect(() => {
    loadRatings();
  }, [activeTab]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const data = await ratingsService.getRatings(20);
      setRatings(data);
    } catch (error) {
      console.error("Error loading ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "following" | "trending") => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <Layout title="BeanRate - Home">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading ratings...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="BeanRate - Home">
      <div className="max-w-md mx-auto">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "following"
                ? "text-brown-600 border-b-2 border-brown-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("following")}
          >
            Following
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "trending"
                ? "text-brown-600 border-b-2 border-brown-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("trending")}
          >
            Trending
          </button>
        </div>

        <div className="space-y-4">
          {ratings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No ratings yet!</p>
              {user && (
                <p className="text-sm text-gray-400">
                  Be the first to rate a coffee bean.
                </p>
              )}
            </div>
          ) : (
            ratings.map((rating) => (
              <RatingCard 
                key={rating.id} 
                rating={{
                  id: rating.id,
                  userId: rating.user_id,
                  user: {
                    id: rating.user_id,
                    username: rating.users?.username || "Unknown",
                    name: rating.users?.display_name || rating.users?.username || "Unknown",
                    // Add default values for required User properties
                    email: "",
                    profileImage: rating.users?.profile_image_url || undefined,
                    bio: undefined,
                    following: [],
                    followers: [],
                    createdAt: new Date().toISOString()
                  },
                  coffeeBeanId: rating.coffee_bean_id,
                  coffeeBean: {
                    id: rating.coffee_bean_id,
                    name: rating.coffee_beans?.name || "Unknown Coffee",
                    roaster: rating.coffee_beans?.brand || "Unknown Brand",
                    origin: rating.coffee_beans?.origin || "Unknown",
                    roastLevel: rating.coffee_beans?.roast_level || "Medium",
                    description: rating.coffee_beans?.description || undefined,
                    imageUrl: rating.coffee_beans?.image_url || undefined,
                    averageRating: 0,
                    totalRatings: 0,
                    createdAt: rating.coffee_beans?.created_at || new Date().toISOString()
                  },
                  rating: rating.overall_rating,
                  brewMethod: rating.brewing_method || "Unknown",
                  tags: [],
                  notes: rating.review_text || undefined,
                  beanImage: rating.coffee_beans?.image_url || undefined,
                  brewedImage: undefined,
                  createdAt: rating.created_at,
                  likes: [],
                  comments: []
                }}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}