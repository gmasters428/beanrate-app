
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw, Coffee, TrendingUp, Users, Sparkles } from "lucide-react";

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
      
      // Add a shorter timeout for better UX
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please check your connection')), 8000)
      );
      
      const ratingsPromise = ratingsService.getRatings(20);
      
      const data = await Promise.race([ratingsPromise, timeoutPromise]) as RatingWithDetails[];
      setRatings(data || []);
    } catch (error) {
      console.error("Error loading ratings:", error);
      setError(error instanceof Error ? error.message : "Failed to load ratings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "following" | "trending") => {
    setActiveTab(tab);
    // Add subtle loading state for tab changes
    setLoading(true);
    setTimeout(() => loadRatings(), 100);
  };

  const handleRetry = () => {
    loadRatings();
  };

  if (loading) {
    return (
      <Layout title="BeanRate - Home">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="relative">
              <div className="animate-spin">
                <Coffee className="h-8 w-8 text-amber-600" />
              </div>
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles className="h-3 w-3 text-amber-400" />
              </div>
            </div>
            <div className="text-gray-500 animate-pulse">Loading delicious ratings...</div>
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
              <Button onClick={handleRetry} variant="outline" size="sm" className="hover:bg-amber-50 hover:border-amber-300 transition-colors">
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
        {/* Welcome Header */}
        <div className="text-center mb-6 px-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Coffee className="h-6 w-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">Welcome to BeanRate</h1>
          </div>
          <p className="text-gray-600 text-sm">Discover amazing coffee through community ratings</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 mx-4">
          <button
            className={`flex-1 py-3 text-center font-medium transition-all duration-300 ${
              activeTab === "following"
                ? "text-amber-600 border-b-2 border-amber-600 bg-amber-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => handleTabChange("following")}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Following</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium transition-all duration-300 ${
              activeTab === "trending"
                ? "text-amber-600 border-b-2 border-amber-600 bg-amber-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
        <div className="space-y-4 px-4">
          {ratings.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <Coffee className="h-16 w-16 text-gray-300 mx-auto" />
                <div className="absolute -top-2 -right-2 animate-bounce">
                  <Sparkles className="h-6 w-6 text-amber-400" />
                </div>
              </div>
              <p className="text-gray-500 mb-2 text-lg font-medium">No ratings yet!</p>
              {user ? (
                <p className="text-sm text-gray-400 mb-6">
                  Be the first to rate a coffee bean and share your experience with the community.
                </p>
              ) : (
                <p className="text-sm text-gray-400 mb-6">
                  Sign in to start rating coffee beans and see personalized content from fellow coffee lovers.
                </p>
              )}
              <Button 
                onClick={() => window.location.href = user ? '/rate' : '/auth/login'}
                className="bg-amber-600 hover:bg-amber-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Coffee className="h-4 w-4 mr-2" />
                {user ? 'Rate Your First Coffee' : 'Join BeanRate'}
              </Button>
            </div>
          ) : (
            <>
              {/* Ratings Feed */}
              <div className="space-y-4">
                {ratings.map((rating, index) => (
                  <div 
                    key={rating.id}
                    className="transform transition-all duration-300"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    <RatingCard rating={rating} />
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {ratings.length >= 20 && (
                <div className="text-center py-6">
                  <Button 
                    variant="outline" 
                    onClick={loadRatings}
                    className="w-full hover:bg-amber-50 hover:border-amber-300 transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load More Ratings
                  </Button>
                </div>
              )}

              {/* Floating Action Button for Rating */}
              {user && (
                <div className="fixed bottom-6 right-6 z-50">
                  <Button
                    onClick={() => window.location.href = '/rate'}
                    className="bg-amber-600 hover:bg-amber-700 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                    size="sm"
                  >
                    <Coffee className="h-6 w-6" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
}