import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { coffeeBeansService, CoffeeBeanWithRatings } from "@/services/coffeeBeansService";
import { ratingsService } from "@/services/ratingsService";
import { ArrowLeft, Star, Camera, PlusCircle, XCircle, Search, Coffee, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function RatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { beanId } = router.query;
  
  const [selectedBean, setSelectedBean] = useState<CoffeeBeanWithRatings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CoffeeBeanWithRatings[]>([]);
  const [popularBeans, setPopularBeans] = useState<CoffeeBeanWithRatings[]>([]);
  const [showSearch, setShowSearch] = useState(!beanId);
  const [isSearching, setIsSearching] = useState(false);
  
  const [rating, setRating] = useState<number>(0);
  const [brewMethod, setBrewMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brewMethods = [
    "Espresso", "Pour Over", "French Press", "AeroPress", "Chemex", 
    "V60", "Drip Coffee", "Cold Brew", "Moka Pot", "Turkish Coffee"
  ];

  useEffect(() => {
    // Load popular beans on component mount
    loadPopularBeans();
  }, []);

  useEffect(() => {
    if (beanId && typeof beanId === "string") {
      loadBeanById(beanId);
    }
  }, [beanId]);

  const loadPopularBeans = async () => {
    try {
      const beans = await coffeeBeansService.getCoffeeBeansWithRatings(6);
      setPopularBeans(beans);
    } catch (error) {
      console.error("Error loading popular beans:", error);
    }
  };

  const loadBeanById = async (id: string) => {
    try {
      const bean = await coffeeBeansService.getCoffeeBeanById(id);
      if (bean) {
        setSelectedBean(bean);
        setShowSearch(false);
      }
    } catch (error) {
      console.error("Error loading bean:", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await coffeeBeansService.searchCoffeeBeans(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching beans:", error);
      toast({
        title: "Search Error",
        description: "Failed to search coffee beans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBean = (bean: CoffeeBeanWithRatings) => {
    setSelectedBean(bean);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmitRating = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a rating.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBean || rating === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a coffee bean and provide a rating.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await ratingsService.createRating({
        coffee_bean_id: selectedBean.id,
        overall_rating: rating,
        brewing_method: brewMethod || undefined,
        review_text: notes || undefined,
      });

      toast({
        title: "Success!",
        description: "Your rating has been submitted successfully.",
      });

      router.push(`/bean/${selectedBean.id}`);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="BeanRate - Rate a Coffee Bean">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Rate a Coffee Bean</h1>
        
        {showSearch ? (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              Find a Coffee Bean
            </h2>
            
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
                  placeholder="Search for a coffee bean..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-2 text-brown-600 hover:text-brown-700"
                  disabled={isSearching}
                >
                  {isSearching ? "..." : "Search"}
                </button>
              </div>
            </form>
            
            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((bean) => (
                  <div
                    key={bean.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleSelectBean(bean)}
                  >
                    <div className="h-10 w-10 relative rounded overflow-hidden">
                      {bean.image_url ? (
                        <Image 
                          src={bean.image_url} 
                          alt={bean.name} 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <Coffee className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{bean.name}</p>
                      <p className="text-sm text-gray-500">by {bean.brand}</p>
                      {bean.averageRating && bean.averageRating > 0 && (
                        <div className="flex items-center mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500 ml-1">
                            {bean.averageRating.toFixed(1)} ({bean.totalRatings})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No coffee beans found.</p>
                <Link href="/bean/add">
                  <button className="mt-2 text-brown-600 hover:text-brown-700 text-sm font-medium">
                    + Add a new coffee bean
                  </button>
                </Link>
              </div>
            ) : null}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Popular Beans</h3>
              <div className="space-y-2">
                {popularBeans.slice(0, 3).map((bean) => (
                  <div
                    key={bean.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleSelectBean(bean)}
                  >
                    <div className="h-10 w-10 relative rounded overflow-hidden">
                      {bean.image_url ? (
                        <Image 
                          src={bean.image_url} 
                          alt={bean.name} 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <Coffee className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{bean.name}</p>
                      <p className="text-sm text-gray-500">by {bean.brand}</p>
                      {bean.averageRating && bean.averageRating > 0 && (
                        <div className="flex items-center mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500 ml-1">
                            {bean.averageRating.toFixed(1)} ({bean.totalRatings})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedBean && (
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-12 w-12 relative rounded overflow-hidden">
                      {selectedBean.image_url ? (
                        <Image 
                          src={selectedBean.image_url} 
                          alt={selectedBean.name} 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <Coffee className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{selectedBean.name}</p>
                      <p className="text-sm text-gray-500">by {selectedBean.brand}</p>
                      {selectedBean.averageRating && selectedBean.averageRating > 0 && (
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-500 ml-1">
                            {selectedBean.averageRating.toFixed(1)} ({selectedBean.totalRatings} ratings)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setSelectedBean(null);
                      setShowSearch(true);
                    }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Rating</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onClick={() => setRating(star)}
                    >
                      <svg
                        className={`h-8 w-8 ${
                          star <= rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 15.585l-7.07 3.716 1.35-7.87L.36 7.13l7.91-1.15L10 0l1.73 5.98 7.91 1.15-5.92 5.77 1.35 7.87z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brew Method (Optional)
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={brewMethod}
                  onChange={(e) => setBrewMethod(e.target.value)}
                >
                  <option value="">Select a brew method</option>
                  {brewMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Share your thoughts about this coffee..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
              
              <button
                className="w-full py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!selectedBean || rating === 0 || isSubmitting}
                onClick={handleSubmitRating}
              >
                {isSubmitting ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}