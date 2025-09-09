
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { Settings, LogOut, MapPin, Users, UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, signOut, loading, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [userRatings, setUserRatings] = useState<RatingWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<"ratings" | "beans">("ratings");
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    try {
      const [friendsCountResult, pendingRequests, ratings] = await Promise.all([
        userService.getFriendsCount(user.id),
        userService.getPendingRequests(),
        ratingsService.getRatingsByUser(user.id),
      ]);
      setFriendsCount(friendsCountResult);
      setPendingRequestsCount(pendingRequests.length);
      setUserRatings(ratings);
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast({ title: "Error", description: "Could not load your profile data.", variant: "destructive" });
    }
  }, [user, toast]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
    if (user) {
      setProfileImageUrl(user.profile?.profile_image_url || null);
      loadProfileData();
    }
  }, [user, loading, router, loadProfileData]);

  // Add a useEffect to refresh data when the page comes into focus (returning from rating submission)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadProfileData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loadProfileData]);

  const handleImageUpdate = async (newImageUrl: string | null) => {
    setProfileImageUrl(newImageUrl);
    await refreshUser();
    toast({ title: "Success", description: "Profile image updated!" });
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (loading || !user) {
    return (
      <Layout title="Loading...">
        <div className="max-w-md mx-auto flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  const displayName = user?.profile?.display_name || user?.profile?.username || "User";

  return (
    <Layout title="My Profile">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-brown-600 h-24"></div>
          <div className="px-4 pb-4 relative">
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <ProfileImageUpload
                userId={user.id}
                currentImageUrl={profileImageUrl}
                onImageUpdate={handleImageUpdate}
                size="lg"
              />
            </div>
            <div className="pt-16 text-center">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1"></div>
                <div className="flex-1 text-center">
                  <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                  <h3 className="font-semibold text-gray-900 mb-2">@{user.profile.username}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{user.profile?.bio || "No bio yet"}</p>
                  </div>
                </div>
                <div className="flex-1 flex justify-end space-x-2">
                  <Link href="/profile/settings"><button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"><Settings className="h-5 w-5" /></button></Link>
                  <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"><LogOut className="h-5 w-5" /></button>
                </div>
              </div>
              {user.bio && <p className="mt-2 text-gray-700 text-center">{user.bio}</p>}
              {user.preferences?.region && <p className="mt-1 text-sm text-gray-500 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" />{user.preferences.region}</p>}
              {user.preferences?.coffeeTypes && (
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {user.preferences.coffeeTypes.map((type) => (<span key={type} className="px-2 py-1 bg-brown-100 text-brown-700 text-xs rounded-full">{type}</span>))}
                </div>
              )}
              <div className="mt-4 flex justify-center space-x-8">
                <Link href="/profile/friends" className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="flex items-center justify-center gap-1 mb-1"><Users className="h-4 w-4 text-brown-600" /><p className="font-bold text-gray-900">{friendsCount}</p></div>
                  <p className="text-sm text-gray-600">Friends</p>
                </Link>
                {pendingRequestsCount > 0 && (
                  <Link href="/profile/friend-requests" className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors relative">
                    <div className="flex items-center justify-center gap-1 mb-1"><p className="font-bold text-brown-600">{pendingRequestsCount}</p></div>
                    <p className="text-sm text-brown-600 font-medium">Requests</p>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-brown-500 rounded-full"></div>
                  </Link>
                )}
                <div className="text-center">
                  <p className="font-bold text-gray-900">{userRatings.length}</p>
                  <p className="text-sm text-gray-600">Ratings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-b border-gray-200 mb-4">
          <button className={`flex-1 py-2 text-center font-medium ${activeTab === "ratings" ? "text-brown-600 border-b-2 border-brown-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("ratings")}>Ratings</button>
          <button className={`flex-1 py-2 text-center font-medium ${activeTab === "beans" ? "text-brown-600 border-b-2 border-brown-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("beans")}>Favorite Beans</button>
        </div>
        {activeTab === "ratings" && (
          <div className="space-y-4">
            {userRatings.length > 0 ? (
              userRatings.map((rating) => <RatingCard key={rating.id} rating={rating} />)
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">You haven't rated any coffee beans yet.</p>
                <Link href="/rate"><Button className="mt-4 bg-brown-600 hover:bg-brown-700">Rate Your First Bean</Button></Link>
              </div>
            )}
          </div>
        )}
        {activeTab === "beans" && <div className="text-center py-8 bg-white rounded-lg shadow-md"><p className="text-gray-500">Favorite beans feature coming soon!</p></div>}
      </div>
    </Layout>
  );
}