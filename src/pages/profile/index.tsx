import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { mockRatings } from "@/data/mockData";
import { Rating } from "@/types";
import { Settings, LogOut, User as UserIcon, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();
  const [userRatings, setUserRatings] = useState<Rating[]>([]);
  const [activeTab, setActiveTab] = useState<"ratings" | "beans">("ratings");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      const filteredRatings = mockRatings.filter((rating) => rating.userId === user.id);
      setUserRatings(filteredRatings);
    }
  }, [user, isAuthenticated, loading, router]);

  const handleTabChange = (tab: "ratings" | "beans") => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <Layout title="BeanRate - Loading...">
        <div className="max-w-md mx-auto flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Layout title="BeanRate - Please Sign In">
        <div className="max-w-md mx-auto text-center mt-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view your profile.</p>
          <div className="space-y-3">
            <Link href="/auth/login">
              <Button className="w-full bg-brown-600 hover:bg-brown-700">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/create-account">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="BeanRate - My Profile">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-brown-600 h-24"></div>
          <div className="px-4 pb-4 relative">
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden relative bg-white">
                {user.profileImage ? (
                  <Image 
                    src={user.profileImage} 
                    alt={user.username} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-14 text-center">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1"></div>
                <div className="flex-1 text-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    {user.preferences?.firstName && user.preferences?.lastName 
                      ? `${user.preferences.firstName} ${user.preferences.lastName}`
                      : user.name
                    }
                  </h1>
                  <p className="text-gray-600">@{user.username}</p>
                </div>
                <div className="flex-1 flex justify-end space-x-2">
                  <Link href="/profile/settings">
                    <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                      <Settings className="h-5 w-5" />
                    </button>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {user.bio && (
                <p className="mt-2 text-gray-700 text-center">{user.bio}</p>
              )}

              {user.preferences?.region && (
                <p className="mt-1 text-sm text-gray-500">📍 {user.preferences.region}</p>
              )}

              {user.preferences?.coffeeTypes && user.preferences.coffeeTypes.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {user.preferences.coffeeTypes.map((type, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-brown-100 text-brown-700 text-xs rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="mt-4 flex justify-center space-x-6">
                <Link href="/profile/following">
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{user.following.length}</p>
                    <p className="text-sm text-gray-600">Following</p>
                  </div>
                </Link>
                <Link href="/profile/followers">
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{user.followers.length}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>
                </Link>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{userRatings.length}</p>
                  <p className="text-sm text-gray-600">Ratings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "ratings"
                ? "text-brown-600 border-b-2 border-brown-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("ratings")}
          >
            Ratings
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "beans"
                ? "text-brown-600 border-b-2 border-brown-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("beans")}
          >
            Favorite Beans
          </button>
        </div>
        
        {activeTab === "ratings" && (
          <div className="space-y-4">
            {userRatings.length > 0 ? (
              userRatings.map((rating) => (
                <RatingCard key={rating.id} rating={rating} />
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">You haven't rated any coffee beans yet.</p>
                <Link href="/rate">
                  <Button className="mt-4 bg-brown-600 hover:bg-brown-700">
                    Rate Your First Bean
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "beans" && (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">Favorite beans feature coming soon!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}