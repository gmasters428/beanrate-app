import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw, Coffee, TrendingUp, Users } from "lucide-react";

export default function HomePage() {
  const [ratings, setRatings] = useState<RatingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"following" | "trending">("trending");
  const { user } = useAuth();

  useEffect(() => {
    loadRatings();
  }, [activeTab]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const ratingsPromise = ratingsService.getRatings(20);
      
      const data = await Promise.race([ratingsPromise, timeoutPromise]) as RatingWithDetails[];
      setRatings(data);
    } catch (error) {
      console.error("Error loading ratings:", error);
      setError("Failed to load ratings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "following" | "trending") => {
    setActiveTab(tab);
  };

  const handleRetry = () => {
    loadRatings();
  };

  if (loading) {
    return (
      <Layout title="BeanRate - Home">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin">
              <Coffee className="h-8 w-8 text-amber-600" />
            </div>
            <div className="text-gray-500">Loading ratings...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="BeanRate - Home">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <Coffee className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <p className="text-gray-600 mb-2">{error}</p>
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="BeanRate - Home">
      <div className="max-w-md mx-auto">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`flex-1 py-3 text-center font-medium transition-colors duration-200 ${
              activeTab === "following"
                ? "text-amber-600 border-b-2 border-amber-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("following")}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Following</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium transition-colors duration-200 ${
              activeTab === "trending"
                ? "text-amber-600 border-b-2 border-amber-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("trending")}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {ratings.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2 text-lg">No ratings yet!</p>
              {user ? (
                <p className="text-sm text-gray-400 mb-4">
                  Be the first to rate a coffee bean and share your experience.
                </p>
              ) : (
                <p className="text-sm text-gray-400 mb-4">
                  Sign in to start rating coffee beans and see personalized content.
                </p>
              )}
              <Button 
                onClick={() => window.location.href = user ? '/rate' : '/auth/login'}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {user ? 'Rate a Coffee' : 'Sign In'}
              </Button>
            </div>
          ) : (
            <>
              {/* Ratings Feed */}
              {ratings.map((rating) => (
                <RatingCard 
                  key={rating.id} 
                  rating={{
                    id: rating.id,
                    userId: rating.user_id,
                    user: {
                      id: rating.user_id,
                      username: rating.users?.username || "Unknown",
                      name: rating.users?.display_name || rating.users?.username || "Unknown",
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
                      description: undefined,
                      imageUrl: rating.coffee_beans?.image_url || undefined,
                      averageRating: 0,
                      totalRatings: 0,
                      createdAt: new Date().toISOString()
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
              ))}
              
              {/* Load More Button */}
              {ratings.length >= 20 && (
                <div className="text-center py-6">
                  <Button 
                    variant="outline" 
                    onClick={loadRatings}
                    className="w-full"
                  >
                    Load More Ratings
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
