import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import Head from "next/head";
import { getServerSupabase } from '@/lib/supabaseServer';
import type { NextApiRequest, NextApiResponse } from 'next';

type Props = {
  userId: string;
  profile: UserProfile | null;
  initialRatings: RatingWithDetails[];
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
    const { data } = await supabase.auth.getSession();
    // Do NOT call any profile-creation RPCs here; keep SSR fast and side-effect free.
    const sessionUserId = data?.session?.user?.id ?? "";
    if (!sessionUserId) {
      return { props: { userId: "", profile: null, initialRatings: [] } };
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", sessionUserId)
      .maybeSingle();

    const { data: ratings, error: ratingsError } = await supabase
      .from("ratings")
      .select(
        `
        *,
        users!fk_ratings_user_id (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          variety,
          image_url
        )
      `
      )
      .eq("user_id", sessionUserId)
      .order("created_at", { ascending: false });

    const initialRatings = ratingsError ? [] : (ratings ?? []);

    if (error) {
      return { props: { userId: sessionUserId, profile: null, initialRatings } };
    }

    return { props: { userId: sessionUserId, profile, initialRatings } };
  } catch {
    // On any SSR auth error, fall back to client-side auth handling
    return { props: { userId: "", profile: null, initialRatings: [] } };
  }
};

const ProfilePage: NextPage<Props> = ({ userId, profile, initialRatings }) => {
  const { user, signOut, refreshUser, status } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [userRatings, setUserRatings] = useState<RatingWithDetails[]>(initialRatings ?? []);
  const [activeTab, setActiveTab] = useState<"ratings" | "beans">("ratings");
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileFallback, setProfileFallback] = useState<UserProfile | null>(profile);
  const [profileFallbackLoading, setProfileFallbackLoading] = useState(false);
  const [profileFallbackError, setProfileFallbackError] = useState<string | null>(null);
  const [profileDataError, setProfileDataError] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const emptyRatingsRetryRef = useRef(0);
  const emptyRatingsTimerRef = useRef<number | null>(null);
  const bootstrapRatingsRetryRef = useRef(0);
  const bootstrapRatingsTimerRef = useRef<number | null>(null);
  const userIdRetryRef = useRef(0);
  const userIdTimerRef = useRef<number | null>(null);

  const effectiveUserId = user?.id || sessionUserId || userId;
  const effectiveProfile = user?.profile ?? profileFallback;
  const debugParam = router.query.debug;
  const showDebugPanel =
    debugParam === "1" || (Array.isArray(debugParam) && debugParam.includes("1"));
  const showProfileWarning =
    !effectiveProfile || profileFallbackLoading || Boolean(profileFallbackError);
  const debugPanel = showDebugPanel ? (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <div className="mb-2 font-semibold">Debug info</div>
      <div className="space-y-1">
        <div>authStatus: {status}</div>
        <div>authUserId: {user?.id || "none"}</div>
        <div>ssrUserId: {userId || "none"}</div>
        <div>sessionChecked: {sessionChecked ? "yes" : "no"}</div>
        <div>sessionUserId: {sessionUserId || "none"}</div>
        <div>sessionError: {sessionError || "none"}</div>
        <div>effectiveUserId: {effectiveUserId || "none"}</div>
        <div>profilePresent: {effectiveProfile ? "yes" : "no"}</div>
        <div>profileFallbackLoading: {profileFallbackLoading ? "yes" : "no"}</div>
        <div>profileFallbackError: {profileFallbackError || "none"}</div>
        <div>profileDataError: {profileDataError || "none"}</div>
      </div>
    </div>
  ) : null;
  const canLoadProfileData =
    Boolean(effectiveUserId) && (Boolean(user?.id) || status === "signedIn" || Boolean(sessionUserId));

  const resolveUserId = useCallback(async () => {
    if (effectiveUserId) return effectiveUserId;
    const { data } = await supabase.auth.getSession();
    let resolvedId = data?.session?.user?.id ?? "";
    if (!resolvedId) {
      const { data: userData } = await supabase.auth.getUser();
      resolvedId = userData?.user?.id ?? "";
    }
    if (resolvedId && resolvedId !== sessionUserId) {
      setSessionUserId(resolvedId);
    }
    return resolvedId;
  }, [effectiveUserId, sessionUserId]);

  const loadRatingsDirect = useCallback(async () => {
    try {
      const response = await fetch("/api/ratings/user");
      if (!response.ok) {
        throw new Error(`Failed to load ratings (${response.status})`);
      }
      const payload = await response.json();
      const ratings = Array.isArray(payload?.data) ? payload.data : [];
      if (ratings.length > 0) {
        setUserRatings(ratings);
        setProfileDataError(null);
      }
    } catch (error) {
      console.error("Error loading ratings via API:", error);
    }
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionId = sessionData?.session?.user?.id ?? "";
      if (sessionId && sessionId !== sessionUserId) {
        setSessionUserId(sessionId);
      }
    } catch (error) {
      console.warn("Profile session check failed:", error);
    }

    const resolvedUserId = await resolveUserId();
    if (!resolvedUserId) {
      if (userIdRetryRef.current < 6) {
        userIdRetryRef.current += 1;
        if (userIdTimerRef.current) {
          window.clearTimeout(userIdTimerRef.current);
        }
        userIdTimerRef.current = window.setTimeout(() => {
          loadProfileData();
        }, 750 * userIdRetryRef.current);
      }
      return;
    }
    userIdRetryRef.current = 0;
    if (userIdTimerRef.current) {
      window.clearTimeout(userIdTimerRef.current);
      userIdTimerRef.current = null;
    }
    setProfileDataError(null);

    const [friendsResult, requestsResult, ratingsResult] = await Promise.allSettled([
      userService.getFriendsCount(resolvedUserId),
      userService.getFriendRequests(resolvedUserId),
      ratingsService.getRatingsByUser(resolvedUserId),
    ]);

    const failures: string[] = [];

    if (friendsResult.status === "fulfilled") {
      setFriendsCount(friendsResult.value);
    } else {
      failures.push("friends");
      console.error("Error loading friends count:", friendsResult.reason);
    }

    if (requestsResult.status === "fulfilled") {
      setPendingRequestsCount(requestsResult.value.length);
    } else {
      failures.push("requests");
      console.error("Error loading friend requests:", requestsResult.reason);
    }

    if (ratingsResult.status === "fulfilled") {
      const nextRatings = ratingsResult.value;

      if (nextRatings.length === 0 && emptyRatingsRetryRef.current < 2) {
        emptyRatingsRetryRef.current += 1;
        if (emptyRatingsTimerRef.current) {
          window.clearTimeout(emptyRatingsTimerRef.current);
        }
        emptyRatingsTimerRef.current = window.setTimeout(() => {
          if (canLoadProfileData) {
            loadProfileData();
          }
        }, 1000 * emptyRatingsRetryRef.current);
      } else {
        emptyRatingsRetryRef.current = 0;
        if (emptyRatingsTimerRef.current) {
          window.clearTimeout(emptyRatingsTimerRef.current);
          emptyRatingsTimerRef.current = null;
        }
        setUserRatings(nextRatings);
      }
    } else {
      failures.push("ratings");
      console.error("Error loading ratings:", ratingsResult.reason);
    }

    if (failures.length > 0) {
      const message = `Could not load: ${failures.join(", ")}.`;
      setProfileDataError(message);
      toast({ title: "Error", description: "Could not load your profile data.", variant: "destructive" });
    }
  }, [resolveUserId, toast, canLoadProfileData, sessionUserId]);

  useEffect(() => {
    if (effectiveProfile) {
      setProfileImageUrl(effectiveProfile.profile_image_url || null);
    }
  }, [effectiveProfile]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    if (!effectiveUserId) return;

    if (userRatings.length > 0) {
      bootstrapRatingsRetryRef.current = 0;
      if (bootstrapRatingsTimerRef.current) {
        window.clearTimeout(bootstrapRatingsTimerRef.current);
        bootstrapRatingsTimerRef.current = null;
      }
      return;
    }

    if (profileDataError || bootstrapRatingsRetryRef.current >= 2) return;

    bootstrapRatingsRetryRef.current += 1;
    if (bootstrapRatingsTimerRef.current) {
      window.clearTimeout(bootstrapRatingsTimerRef.current);
    }
    bootstrapRatingsTimerRef.current = window.setTimeout(() => {
      loadRatingsDirect();
    }, 1200 * bootstrapRatingsRetryRef.current);
  }, [effectiveUserId, userRatings.length, profileDataError, loadRatingsDirect]);

  useEffect(() => {
    return () => {
      if (emptyRatingsTimerRef.current) {
        window.clearTimeout(emptyRatingsTimerRef.current);
      }
      if (bootstrapRatingsTimerRef.current) {
        window.clearTimeout(bootstrapRatingsTimerRef.current);
      }
      if (userIdTimerRef.current) {
        window.clearTimeout(userIdTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (effectiveProfile || !effectiveUserId) return;

    let isMounted = true;
    setProfileFallbackLoading(true);
    setProfileFallbackError(null);

    userService
      .getUserProfile(effectiveUserId)
      .then((profile) => {
        if (isMounted) {
          setProfileFallback(profile);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Unknown error";
        setProfileFallbackError(message);
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
  }, [effectiveProfile, effectiveUserId]);

  useEffect(() => {
    if (effectiveUserId) {
      setSessionChecked(true);
      loadProfileData();
      return;
    }

    if (status === "signedOut") {
      setSessionChecked(true);
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      if (isMounted) {
        setSessionChecked(true);
      }
    }, 4000);

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setSessionError(error.message);
          console.warn("Failed to check auth session on profile page:", error);
          return;
        }
        setSessionError(null);
        if (isMounted) {
          setSessionUserId(data?.session?.user?.id ?? "");
        }
      })
      .finally(() => {
        if (isMounted) {
          setSessionChecked(true);
        }
        window.clearTimeout(timeoutId);
      });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [effectiveUserId, status, loadProfileData]);

  useEffect(() => {
    const handleFocus = () => {
      if (canLoadProfileData) {
        loadProfileData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [canLoadProfileData, loadProfileData]);

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

  const handleRetrySession = () => {
    setSessionChecked(false);
    setSessionUserId("");
    void refreshUser();
  };

  const handleRetryProfileData = () => {
    if (canLoadProfileData) {
      loadProfileData();
      return;
    }
    void refreshUser();
  };

  if (!effectiveUserId) {
    if (status === "signedOut") {
      return (
        <>
          <Head>
            <title>Sign In - BeanRate</title>
          </Head>
          <div className="max-w-md mx-auto mt-6 space-y-4 text-center">
            {debugPanel}
            <Alert>
              <AlertDescription>Please sign in to view your profile.</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/auth/login")} className="bg-brown-600 hover:bg-brown-700">
              Sign In
            </Button>
          </div>
        </>
      );
    }

    if (sessionChecked) {
      return (
        <>
          <Head>
            <title>Profile Error - BeanRate</title>
          </Head>
          <div className="max-w-md mx-auto mt-6 space-y-4 text-center">
            {debugPanel}
            <Alert variant="destructive">
              <AlertDescription>We couldn't verify your session. Please try again.</AlertDescription>
            </Alert>
            <div className="flex justify-center gap-3">
              <Button onClick={handleRetrySession} className="bg-brown-600 hover:bg-brown-700">
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push("/auth/login")}>
                Sign In
              </Button>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Head>
          <title>Loading... - BeanRate</title>
        </Head>
        <div className="max-w-md mx-auto flex flex-col justify-center items-center h-64">
          {debugPanel}
          <div className="text-gray-500">Loading...</div>
        </div>
      </>
    );
  }

  const preferences = parseUserPreferences(effectiveProfile?.bio);
  const profileMeta = effectiveProfile as { full_name?: string | null } | null;
  const username = effectiveProfile?.username?.replace(/^@/, "").trim();
  const fallbackUsername =
    user?.email?.split("@")[0] || (effectiveUserId ? effectiveUserId.slice(0, 6) : "user");
  const resolvedUsername = username || fallbackUsername;
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
    resolvedUsername ||
    "User";

  return (
    <>
      <Head>
        <title>My Profile - BeanRate</title>
      </Head>
      <div className="max-w-md mx-auto">
        {debugPanel}
        {showProfileWarning && (
          <div className="mb-4 space-y-3">
            <Alert variant="destructive">
              <AlertDescription>
                We couldn't load your profile details yet. You can retry, or sign out and back in.
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
        )}
        {profileDataError && (
          <div className="mb-4 space-y-3">
            <Alert variant="destructive">
              <AlertDescription>
                We couldn't load all of your profile data yet. Please retry.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center gap-3">
              <Button onClick={handleRetryProfileData} className="bg-brown-600 hover:bg-brown-700">
                Retry
              </Button>
            </div>
          </div>
        )}
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
                  <h3 className="font-semibold text-gray-900 mb-2">@{resolvedUsername}</h3>
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
