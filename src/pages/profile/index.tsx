import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps, NextPage } from 'next';
import RatingCard from "@/components/home/RatingCard";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { Settings, LogOut, MapPin, Users, UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { formatUserPreferences } from "@/lib/utils";
import Head from "next/head";
import { getServerSupabase } from '@/lib/supabaseServer';
import type { NextApiRequest, NextApiResponse } from 'next';

type Props = {
  userId: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  try {
    const supabase = getServerSupabase({ req: ctx.req as any, res: ctx.res as any });
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) {
      return { redirect: { destination: '/auth/login', permanent: false } };
    }
    // Do NOT call any profile-creation RPCs here; keep SSR fast and side-effect free.
    return { props: { userId: data.session.user.id } };
  } catch {
    // On any SSR auth error, send user to login instead of throwing a 500
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
};

const ProfilePage: NextPage<Props> = ({ userId }) => {
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
        userService.getFriendRequests(user.id),
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
    if (user) {
      setProfileImageUrl(user.profile?.profile_image_url || null);
      loadProfileData();
    }
  }, [user, loadProfileData]);

  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadProfileData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
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
      <>
        <Head>
          <title>Loading... - BeanRate</title>
        </Head>
        <div className="max-w-md mx-auto flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </>
    );
  }

  const displayName = user?.profile?.display_name || user?.profile?.username || "User";

  return (
    <>
      <Head>
        <title>My Profile - BeanRate</title>
      </Head>
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
                    <p>{formatUserPreferences(user.profile?.bio)}</p>
                  </div>
                </div>
                <div className="flex-1 flex justify-end space-x-2">
                  <Link href="/profile/settings"><button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"><Settings className="h-5 w-5" /></button></Link>
                  <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"><LogOut className="h-5 w-5" /></button>
                </div>
              </div>
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
    </>
  );
}

export default ProfilePage;