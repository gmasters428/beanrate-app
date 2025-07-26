import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { mockRatings } from "@/data/mockData";
import { Rating } from "@/types";
import { ArrowLeft, User as UserIcon, MapPin, UserPlus, UserCheck, UserX, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { userService, UserWithProfile, FriendshipStatus } from "@/services/userService";

export default function UserProfilePage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [profileUser, setProfileUser] = useState<UserWithProfile | null>(null);
  const [userRatings, setUserRatings] = useState<Rating[]>([]);
  const [activeTab, setActiveTab] = useState<"ratings" | "beans">("ratings");
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const [profile, friendship, friendsCountResult] = await Promise.all([
        userService.getUserProfile(userId),
        currentUser ? userService.getFriendshipStatus(userId) : Promise.resolve({ status: 'none' as const }),
        userService.getFriendsCount(userId)
      ]);

      if (!profile) {
        router.push("/404");
        return;
      }

      setProfileUser(profile);
      setFriendshipStatus(friendship);
      setFriendsCount(friendsCountResult);

      // Load user's ratings (mock data for now)
      const filteredRatings = mockRatings.filter((rating) => rating.userId === userId);
      setUserRatings(filteredRatings);
    } catch (error) {
      console.error("Error loading user profile:", error);
      router.push("/404");
    } finally {
      setLoading(false);
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth/login");
      return;
    }

    if (id && typeof id === 'string') {
      loadUserProfile(id);
    }
  }, [id, currentUser, authLoading, router, loadUserProfile]);

  const handleSendFriendRequest = async () => {
    if (!profileUser || !currentUser) return;
    
    try {
      setActionLoading(true);
      await userService.sendFriendRequest(profileUser.id);
      setFriendshipStatus({ status: 'pending_sent' });
    } catch (error) {
      console.error("Error sending friend request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!profileUser) return;
    
    try {
      setActionLoading(true);
      await userService.acceptFriendRequest(profileUser.id);
      setFriendshipStatus({ status: 'accepted' });
      setFriendsCount(prev => prev + 1);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (!profileUser) return;
    
    try {
      setActionLoading(true);
      await userService.rejectFriendRequest(profileUser.id);
      setFriendshipStatus({ status: 'none' });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profileUser) return;
    
    try {
      setActionLoading(true);
      await userService.removeFriend(profileUser.id);
      setFriendshipStatus({ status: 'none' });
      setFriendsCount(prev => prev - 1);
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTabChange = (tab: "ratings" | "beans") => {
    setActiveTab(tab);
  };

  if (authLoading || loading) {
    return (
      <Layout title="BeanRate - Loading...">
        <div className="max-w-md mx-auto flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return null;
  }

  const displayName = profileUser.display_name || profileUser.username;
  const hasBio = profileUser.bio && profileUser.bio.trim().length > 0;

  const renderFriendshipButton = () => {
    if (!currentUser || currentUser.id === profileUser.id) return null;

    switch (friendshipStatus.status) {
      case 'none':
        return (
          <Button 
            onClick={handleSendFriendRequest}
            disabled={actionLoading}
            className="bg-brown-600 hover:bg-brown-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friend
          </Button>
        );
      case 'pending_sent':
        return (
          <Button variant="outline" disabled>
            <UserCheck className="h-4 w-4 mr-2" />
            Request Sent
          </Button>
        );
      case 'pending_received':
        return (
          <div className="flex space-x-2">
            <Button 
              onClick={handleAcceptFriendRequest}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button 
              variant="outline"
              onClick={handleRejectFriendRequest}
              disabled={actionLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <UserX className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <Button 
            variant="outline"
            onClick={handleRemoveFriend}
            disabled={actionLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Remove Friend
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Layout title={`BeanRate - ${displayName}`}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Profile</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-brown-600 h-24"></div>
          <div className="px-4 pb-4 relative">
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden relative bg-white">
                {profileUser.profile_image_url ? (
                  <Image 
                    src={profileUser.profile_image_url} 
                    alt={displayName} 
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
            
            <div className="pt-16 text-center">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              <p className="text-gray-600">@{profileUser.username}</p>
              
              {hasBio && (
                <p className="mt-2 text-gray-700 text-center">{profileUser.bio}</p>
              )}

              <div className="mt-4 flex justify-center">
                {renderFriendshipButton()}
              </div>
              
              <div className="mt-4 flex justify-center space-x-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-brown-600" />
                    <p className="font-bold text-gray-900">{friendsCount}</p>
                  </div>
                  <p className="text-sm text-gray-600">Friends</p>
                </div>
                
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
                <p className="text-gray-500">No ratings yet.</p>
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
