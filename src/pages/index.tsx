
import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw, Coffee, TrendingUp, Users, Sparkles, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [ratings, setRatings] = useState<RatingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"trending" | "recent" | "following">("trending");
  const { user } = useAuth();
  
  // Use refs to prevent memory leaks
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadRatings = useCallback(async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // Create timeout promise that cleans up properly
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Request timeout - please check your connection'));
        }, 10000); // Increased timeout to 10 seconds
      });
      
      const ratingsPromise = ratingsService.getRatings(20);
      
      const data = await Promise.race([ratingsPromise, timeoutPromise]);
      
      // Clear timeout if request succeeded
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setRatings(data || []);
        setError(null);
      }
    } catch (error) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Only update state if component is still mounted and error wasn't due to abort
      if (mountedRef.current && error instanceof Error && error.name !== 'AbortError') {
        console.error("Error loading ratings:", error);
        setError(error.message || "Failed to load ratings. Please try again.");
        setRatings([]); // Clear existing data on error
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial load with debouncing
  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      loadRatings();
    }, 100);

    return () => clearTimeout(loadTimeout);
  }, [loadRatings, activeTab]);

  const handleTabChange = useCallback((tab: "trending" | "recent" | "following") => {
    setActiveTab(tab);
  }, []);

  const handleRetry = useCallback(() => {
    loadRatings();
  }, []);

  if (loading) {
    return (
      <Layout title="BeanRate - Discover Great Coffee">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="relative">
              <div className="animate-spin">
                <Coffee className="h-8 w-8 text-amber-600" />
              </div>
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles className="h-3 w-3 text-amber-400" />
              </div>
            </div>
            <div className="text-gray-500 animate-pulse">Loading coffee discoveries...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="BeanRate - Discover Great Coffee">
        <div className="max-w-2xl mx-auto">
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
    <Layout title="BeanRate - Discover Great Coffee">
      <div className="max-w-2xl mx-auto">
        {/* Page Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Coffee Discovery</h1>
              <p className="text-sm text-gray-500">Find your next favorite beans</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/search">
                <Button variant="outline" size="sm" className="bg-transparent hover:bg-amber-50 hover:border-amber-300">
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="bg-transparent hover:bg-amber-50 hover:border-amber-300">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-neutral-50 to-white border border-neutral-200/60 rounded-2xl p-1.5 shadow-sm">
            <div className="flex">
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                  activeTab === "trending"
                    ? "bg-white text-amber-600 shadow-lg shadow-amber-500/10 transform scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                }`}
                onClick={() => handleTabChange("trending")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trending</span>
                </div>
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                  activeTab === "recent"
                    ? "bg-white text-amber-600 shadow-lg shadow-amber-500/10 transform scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                }`}
                onClick={() => handleTabChange("recent")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Coffee className="h-4 w-4" />
                  <span>Recent</span>
                </div>
              </button>
              {user && (
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeTab === "following"
                      ? "bg-white text-amber-600 shadow-lg shadow-amber-500/10 transform scale-[1.02]"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  }`}
                  onClick={() => handleTabChange("following")}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Following</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {ratings.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <Coffee className="h-12 w-12 text-amber-600" />
                </div>
                <div className="absolute -top-2 -right-8 animate-bounce">
                  <Sparkles className="h-8 w-8 text-amber-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No coffee ratings yet!</h2>
              {user ? (
                <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                  Be the first to rate a coffee bean and help others discover great coffee. Your reviews help fellow coffee lovers make better choices.
                </p>
              ) : (
                <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                  Join our community of coffee enthusiasts to discover amazing beans and share your tasting experiences.
                </p>
              )}
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  onClick={() => window.location.href = user ? '/rate' : '/auth/login'}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl px-6"
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  {user ? 'Rate Your First Bean' : 'Join BeanRate'}
                </Button>
                <Link href="/search">
                  <Button variant="outline" className="bg-transparent hover:bg-amber-50 hover:border-amber-300 rounded-xl">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Beans
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Ratings Feed */}
              <div className="space-y-4">
                {ratings.map((rating, index) => (
                  <div 
                    key={rating.id}
                    className="transform transition-all duration-300 hover:scale-[1.01]"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.4s ease-out forwards'
                    }}
                  >
                    <RatingCard rating={rating} />
                  </div>
                ))}
              </div>
              
              {/* Load More */}
              {ratings.length >= 20 && (
                <div className="text-center py-8">
                  <Button 
                    variant="outline" 
                    onClick={handleRetry}
                    className="bg-transparent hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Discover More Coffee
                  </Button>
                </div>
              )}

              {/* Enhanced Quick Actions */}
              <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3">
                <Link href="/search">
                  <Button
                    variant="outline"
                    className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 border-neutral-200"
                    size="sm"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </Link>
                {user && (
                  <Link href="/rate">
                    <Button
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                      size="sm"
                    >
                      <Coffee className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
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
