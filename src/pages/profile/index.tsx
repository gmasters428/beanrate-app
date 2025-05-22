
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { mockUsers, mockRatings } from "@/data/mockData";
import { User, Rating } from "@/types";
import { Settings, LogOut, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  // In a real app, we would get the current user from auth context
  // For now, we'll just use the first user from our mock data
  const [user, setUser] = useState<User>(mockUsers[0]);
  const [userRatings, setUserRatings] = useState<Rating[]>(
    mockRatings.filter((rating) => rating.userId === user.id)
  );
  const [activeTab, setActiveTab] = useState<"ratings" | "beans">("ratings");

  const handleTabChange = (tab: "ratings" | "beans") => {
    setActiveTab(tab);
    // In a real app, we would fetch different data based on the tab
  };

  return (
    <Layout title="BeanRate - My Profile">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-brown-600 h-24"></div>
          <div className="px-4 pb-4 relative">
            <div className="absolute -top-12 left-4">
              <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden relative">
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
            
            <div className="mt-14">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-gray-600">@{user.username}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                    <Settings className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {user.bio && (
                <p className="mt-2 text-gray-700">{user.bio}</p>
              )}
              
              <div className="mt-4 flex space-x-4">
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
                <button
                  onClick={() => window.location.href = "/rate"}
                  className="mt-4 px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700"
                >
                  Rate Your First Bean
                </button>
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
