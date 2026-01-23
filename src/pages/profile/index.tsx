import { useState, useEffect, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps, NextPage } from 'next';
import RatingCard from "@/components/home/RatingCard";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { Settings, LogOut, Users, UserIcon, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { formatUserPreferences } from "@/lib/utils";
import { parseUserPreferences } from "@/utils/profilePreferences";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UserProfile } from "@/types";
import Head from "next/head";
import { getServerSupabase } from '@/lib/supabaseServer';
import type { NextApiRequest, NextApiResponse } from 'next';

type Props = {
  userId: string;
};

type StatProps = {
  icon?: ReactNode;
  value: number;
  label: string;
};

const Stat = ({ icon, value, label }: StatProps) => (
  <div className="flex flex-col items-center text-center">
    <div className="flex items-center justify-center gap-1 mb-1">
      {icon}
      <p className="font-bold text-gray-900">{value}</p>
    </div>
    <p className="text-sm text-gray-600">{label}</p>
  </div>
);

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
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [userRatings, setUserRatings] = useState<RatingWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<"ratings" | "beans">("ratings");
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileFallback, setProfileFallback] = useState<UserProfile | null>(null);
  const [profileFallbackLoading, setProfileFallbackLoading] = useState(false);

  const effectiveUserId = user?.id ?? userId;
  const effectiveProfile = user?.profile ?? profileFallback;

  const loadProfileData = useCallback(async () => {
    if (!effectiveUserId) return;
    try {
      const [friendsCountResult, pendingRequests, ratings] = await Promise.all([
        userService.getFriendsCount(effectiveUserId),
        userService.getFriendRequests(effectiveUserId),
        ratingsService.getRatingsByUser(effectiveUserId),
      ]);
      setFriendsCount(friendsCountResult);
      setPendingRequestsCount(pendingRequests.length);
      setUserRatings(ratings);
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast({ title: "Error", description: "Could not load your profile data.", variant: "destructive" });
    }
  }, [effectiveUserId, toast]);

  useEffect(() => {
    if (effectiveProfile) {
      setProfileImageUrl(effectiveProfile.profile_image_url || null);
    }
  }, [effectiveProfile]);

  useEffect(() => {
    if (effectiveUserId) {
      loadProfileData();
    }
  }, [effectiveUserId, loadProfileData]);

  useEffect(() => {
    if (user?.profile || !userId) return;

    let isMounted = true;
    setProfileFallbackLoading(true);

    userService
      .getUserProfile(userId)
      .then((profile) => {
        if (isMounted) {
          setProfileFallback(profile);
        }
      })
      .catch((error) => {
        console.error("Error loading fallback profile:", error);
      })
      .finally(() => {
        if (isMounted) {
          setProfileFallbackLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.profile, userId]);

  useEffect(() => {
    const handleFocus = () => {
      if (effectiveUserId) {
        loadProfileData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [effectiveUserId, loadProfileData]);

  const handleImageUpdate = async (newImageUrl: string | null) => {
    setProfileImageUrl(newImageUrl);
    setProfileFallback((prev) =>
      prev ? { ...prev, profile_image_url: newImageUrl } : prev
    );
    await refreshUser();
    toast({ title: "Success", description: "Profile image updated!" });
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (!effectiveUserId) {
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

  if (!effectiveProfile) {
    if (profileFallbackLoading) {
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

    return (
      <>
        <Head>
          <title>Profile Error - BeanRate</title>
        </Head>
        <div className="max-w-md mx-auto mt-6 space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              We couldn't load your profile details. Please try again or sign out and back in.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center gap-3">
            <Button onClick={() => refreshUser()} className="bg-brown-600 hover:bg-brown-700">
              Retry
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </>
    );
  }

  const preferences = parseUserPreferences(effectiveProfile?.bio);
  const profileMeta = effectiveProfile as { full_name?: string | null } | null;
  const username = effectiveProfile?.username?.replace(/^@/, "").trim();
  const displayName =
    [
      effectiveProfile?.display_name,
      profileMeta?.full_name,
      preferences?.firstName,
      (user as any)?.user_metadata?.full_name,
      (user as any)?.user_metadata?.name,
    ]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find((value) => value && value !== username) ||
    username ||
    effectiveProfile?.username ||
    "User";

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
                userId={effectiveUserId}
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
                  <h3 className="font-semibold text-gray-900 mb-2">@{effectiveProfile?.username}</h3>
                  {preferences && (
                    <div className="space-y-2 text-sm">
                      {(preferences.firstName || preferences.region) && (
                        <p className="text-gray-500">
                          {[preferences.firstName, preferences.region].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {preferences.coffeeTypes && preferences.coffeeTypes.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {preferences.coffeeTypes.map((type, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex justify-end space-x-2">
                  <Link href="/profile/settings"><button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"><Settings className="h-5 w-5" /></button></Link>
                  <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"><LogOut className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-8">
                <Link href="/profile/friends" className="rounded-lg p-2 transition-colors hover:bg-gray-50">
                  <Stat icon={<Users className="h-4 w-4 text-brown-600" />} value={friendsCount} label="Friends" />
                </Link>
                {pendingRequestsCount > 0 && (
                  <Link href="/profile/friend-requests" className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors relative">
                    <div className="flex items-center justify-center gap-1 mb-1"><p className="font-bold text-brown-600">{pendingRequestsCount}</p></div>
                    <p className="text-sm text-brown-600 font-medium">Requests</p>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-brown-500 rounded-full"></div>
                  </Link>
                )}
                <div className="rounded-lg p-2">
                  <Stat icon={<Star className="h-4 w-4 text-brown-600" />} value={userRatings.length} label="Ratings" />
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
