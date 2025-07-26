import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/search/SearchBar";
import BeanCard from "@/components/search/BeanCard";
import { mockBeans } from "@/data/mockData";
import { CoffeeBean } from "@/types";
import { User as UserIcon, UserPlus, Coffee } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { userService, UserWithProfile } from "@/services/userService";

export default function SearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"beans" | "users">("beans");
  const [filteredBeans, setFilteredBeans] = useState<CoffeeBean[]>([]);
  const [searchResults, setSearchResults] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const results = await userService.searchUsers(query);
      // Filter out current user from results
      const filteredResults = results.filter(result => result.id !== user.id);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (searchType === "beans") {
      if (searchQuery.trim() === "") {
        setFilteredBeans(mockBeans);
      } else {
        const filtered = mockBeans.filter(
          (bean) =>
            bean.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bean.roaster.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bean.origin.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredBeans(filtered);
      }
    } else if (searchType === "users" && searchQuery.trim() !== "") {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchType, searchUsers]);

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await userService.sendFriendRequest(userId);
      // Update the user in the search results to show request sent
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, friendRequestSent: true }
            : user
        )
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  return (
    <Layout title="BeanRate - Search">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search</h1>
          
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchType === "beans"
                  ? "bg-white text-brown-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setSearchType("beans")}
            >
              <Coffee className="h-4 w-4 inline mr-2" />
              Coffee Beans
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchType === "users"
                  ? "bg-white text-brown-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setSearchType("users")}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              People
            </button>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              searchType === "beans" 
                ? "Search coffee beans, roasters, origins..." 
                : "Search for people by name or email..."
            }
          />
        </div>

        {searchType === "beans" && (
          <div className="space-y-4">
            {filteredBeans.length > 0 ? (
              filteredBeans.map((bean) => (
                <BeanCard key={bean.id} bean={bean} />
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? "No coffee beans found matching your search." : "Start typing to search for coffee beans."}
                </p>
              </div>
            )}
          </div>
        )}

        {searchType === "users" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Searching...</div>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((searchUser) => (
                <div key={searchUser.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden relative bg-gray-200">
                        {searchUser.profile_image_url ? (
                          <Image 
                            src={searchUser.profile_image_url} 
                            alt={searchUser.display_name || searchUser.username} 
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {searchUser.display_name || searchUser.username}
                        </h3>
                        <p className="text-sm text-gray-500">@{searchUser.username}</p>
                        {searchUser.bio && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {searchUser.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/profile/${searchUser.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      {user && (
                        <Button 
                          size="sm"
                          onClick={() => handleSendFriendRequest(searchUser.id)}
                          disabled={(searchUser as any).friendRequestSent}
                          className="bg-brown-600 hover:bg-brown-700"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {(searchUser as any).friendRequestSent ? "Sent" : "Add"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? "No people found matching your search." : "Start typing to search for people."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
