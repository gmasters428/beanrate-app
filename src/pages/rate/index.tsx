
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { mockBeans, mockBrewMethods, mockTags } from "@/data/mockData";
import { CoffeeBean } from "@/types";
import { ArrowLeft, Star, Camera, PlusCircle, XCircle, Search, Coffee, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function RatePage() {
  const router = useRouter();
  const { beanId } = router.query;
  
  const [selectedBean, setSelectedBean] = useState<CoffeeBean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CoffeeBean[]>([]);
  const [showSearch, setShowSearch] = useState(!beanId);
  
  const [rating, setRating] = useState<number>(0);
  const [brewMethod, setBrewMethod] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [beanImage, setBeanImage] = useState<string | null>(null);
  const [brewedImage, setBrewedImage] = useState<string | null>(null);

  useEffect(() => {
    if (beanId && typeof beanId === "string") {
      const bean = mockBeans.find((b) => b.id === beanId);
      if (bean) {
        setSelectedBean(bean);
        setShowSearch(false);
      }
    }
  }, [beanId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    
    const results = mockBeans.filter(
      (bean) =>
        bean.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bean.roaster.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
  };

  const handleSelectBean = (bean: CoffeeBean) => {
    setSelectedBean(bean);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitRating = () => {
    // In a real app, we would submit the rating to the backend
    // For now, we'll just show a success message and redirect
    alert("Rating submitted successfully!");
    router.push("/");
  };

  // Mock image upload function
  const handleImageUpload = (type: "bean" | "brewed") => {
    // In a real app, we would handle file uploads
    // For now, we'll just use a random image from our mock data
    const randomImage = mockBeans[Math.floor(Math.random() * mockBeans.length)].imageUrl;
    
    if (type === "bean") {
      setBeanImage(randomImage || null);
    } else {
      setBrewedImage(randomImage || null);
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
                >
                  Search
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
                      {bean.imageUrl ? (
                        <Image 
                          src={bean.imageUrl} 
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
                      <p className="text-sm text-gray-500">by {bean.roaster}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No coffee beans found.</p>
                <button
                  className="mt-2 text-brown-600 hover:text-brown-700 text-sm font-medium"
                  onClick={() => {
                    // In a real app, we would show a form to add a new bean
                    alert("Add new bean feature coming soon!");
                  }}
                >
                  + Add a new coffee bean
                </button>
              </div>
            ) : null}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Popular Beans</h3>
              <div className="space-y-2">
                {mockBeans.slice(0, 3).map((bean) => (
                  <div
                    key={bean.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleSelectBean(bean)}
                  >
                    <div className="h-10 w-10 relative rounded overflow-hidden">
                      {bean.imageUrl ? (
                        <Image 
                          src={bean.imageUrl} 
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
                      <p className="text-sm text-gray-500">by {bean.roaster}</p>
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
                      {selectedBean.imageUrl ? (
                        <Image 
                          src={selectedBean.imageUrl} 
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
                      <p className="text-sm text-gray-500">by {selectedBean.roaster}</p>
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
                  Brew Method
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={brewMethod}
                  onChange={(e) => setBrewMethod(e.target.value)}
                >
                  <option value="">Select a brew method</option>
                  {mockBrewMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {mockTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedTags.includes(tag)
                          ? "bg-brown-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Share your thoughts about this coffee..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Coffee Beans</p>
                    {beanImage ? (
                      <div className="relative h-32 rounded-lg overflow-hidden">
                        <Image 
                          src={beanImage} 
                          alt="Coffee beans" 
                          fill
                          className="object-cover"
                        />
                        <button
                          className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white"
                          onClick={() => setBeanImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="h-32 w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400"
                        onClick={() => handleImageUpload("bean")}
                      >
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-xs">Add Photo</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Brewed Coffee</p>
                    {brewedImage ? (
                      <div className="relative h-32 rounded-lg overflow-hidden">
                        <Image 
                          src={brewedImage} 
                          alt="Brewed coffee" 
                          fill
                          className="object-cover"
                        />
                        <button
                          className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white"
                          onClick={() => setBrewedImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="h-32 w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400"
                        onClick={() => handleImageUpload("brewed")}
                      >
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-xs">Add Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                className="w-full py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!selectedBean || rating === 0 || !brewMethod}
                onClick={handleSubmitRating}
              >
                Submit Rating
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
