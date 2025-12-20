import { useState, useEffect, useCallback, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import RatingCard from "@/components/home/RatingCard";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { ArrowLeft, User as UserIcon, Users, UserPlus, UserCheck, UserX, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { userService, UserWithProfile, FriendshipStatus } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { isUUID } from "@/lib/ids";
import { supabase } from "@/integrations/supabase/client";
import { parseUserPreferences } from "@/utils/profilePreferences";

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

export default function UserProfilePage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { id: slugParam } = router.query;
  
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserWithProfile | null>(null);
  const [userRatings, setUserRatings] = useState<RatingWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<"ratings" | "beans">("ratings");
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Step 1: Resolve slug to targetUserId
  useEffect(() => {
    const resolveSlugToUserId = async () => {
      // Wait for router to be ready and slugParam to be available
      if (!router.isReady || !slugParam || typeof slugParam !== 'string') {
        return;
      }

      try {
        const raw = slugParam;
        // Normalize: strip "@" prefix, trim, and lowercase
        const slug = raw.replace(/^@/, '').trim().toLowerCase();

        let userId: string | null = null;

        // Check if raw param is already a UUID
        if (isUUID(raw)) {
          userId = raw;
        } else if (slug) {
          // Look up user by lowercase username (index makes this fast)
          const { data: userByName, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', slug)
            .maybeSingle();

          if (error) {
            console.error('Error resolving username:', error);
            setNotFound(true);
            setLoading(false);
            return;
          }

          if (!userByName) {
            // User not found - show 404
            setNotFound(true);
            setLoading(false);
            return;
          }

          userId = userByName.id;
        }

        if (!userId) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Set the resolved userId
        setTargetUserId(userId);
      } catch (error) {
        console.error('Error resolving slug:', error);
        setNotFound(true);
        setLoading(false);
      }
    };

    resolveSlugToUserId();
  }, [router.isReady, slugParam]);

  // Step 2: Load user profile data only after targetUserId is resolved
  const loadUserProfile = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      setLoading(true);
      
      const [profile, friendship, friendsCountResult, ratings] = await Promise.all([
        userService.getUserProfile(userId),
        currentUser ? userService.getFriendshipStatus(currentUser.id, userId) : Promise.resolve({ status: 'none' as const }),
        userService.getFriendsCount(userId),
        ratingsService.getRatingsByUser(userId),
      ]);

      if (!profile) {
        setNotFound(true);
        return;
      }

      setProfileUser(profile);
      setFriendshipStatus(friendship);
      setFriendsCount(friendsCountResult);
      setUserRatings(ratings);
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast({ title: "Error", description: "Could not load user profile.", variant: "destructive" });
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  // Step 3: Trigger profile load only when targetUserId is available
  useEffect(() => {
    if (targetUserId) {
      loadUserProfile(targetUserId);
    }
  }, [targetUserId, loadUserProfile]);

  const handleFriendAction = async (action: () => Promise<any>, status: FriendshipStatus['status'], message: string) => {
    if (!profileUser || !currentUser) return;
    setActionLoading(true);
    try {
      await action();
      setFriendshipStatus({ status });
      if (status === 'accepted') setFriendsCount(prev => prev + 1);
      if (status === 'none' && friendshipStatus.status === 'accepted') setFriendsCount(prev => prev - 1);
      toast({ title: "Success", description: message });
    } catch (error) {
      console.error('Error with friend action:', error);
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendFriendRequest = () => handleFriendAction(
    () => userService.sendFriendRequest(currentUser!.id, profileUser!.id), 
    'pending_sent', 
    'Friend request sent.'
  );
  
  const handleAcceptFriendRequest = () => handleFriendAction(
    () => userService.acceptFriendRequest(friendshipStatus.friendshipId!, currentUser!.id), 
    'accepted', 
    'Friend request accepted.'
  );

  const handleRejectFriendRequest = () => handleFriendAction(
    () => userService.rejectFriendRequest(friendshipStatus.friendshipId!), 
    'none', 
    'Friend request declined.'
  );

  const handleRemoveFriend = () => handleFriendAction(
    () => userService.removeFriend(friendshipStatus.friendshipId!), 
    'none', 
    'Friend removed.'
  );

  // Show 404 if user not found
  if (notFound) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
        <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/')} className="bg-brown-600 hover:bg-brown-700">
          Go Home
        </Button>
      </div>
    );
  }

  // Show loading state
  if (authLoading || loading || !targetUserId) {
    return (
      <div className="text-center p-10">Loading profile...</div>
    );
  }

  // Profile user must be loaded by this point
  if (!profileUser) return null;

  const preferences = parseUserPreferences(profileUser.bio);
  const username = profileUser.username?.replace(/^@/, "").trim();
  const profileMeta = profileUser as { full_name?: string | null };
  const displayName =
    [profileUser.display_name, profileMeta?.full_name, preferences?.firstName]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find((value) => value && value !== username) ||
    username ||
    profileUser.username ||
    "User";

  const renderFriendshipButton = () => {
    if (!currentUser || currentUser.id === profileUser.id) return null;

    switch (friendshipStatus.status) {
      case 'none':
        return <Button onClick={handleSendFriendRequest} disabled={actionLoading} className="bg-brown-600 hover:bg-brown-700"><UserPlus className="h-4 w-4 mr-2" />Add Friend</Button>;
      case 'pending_sent':
        return <Button variant="outline" disabled><UserCheck className="h-4 w-4 mr-2" />Request Sent</Button>;
      case 'pending_received':
        return (
          <div className="flex space-x-2">
            <Button onClick={handleAcceptFriendRequest} disabled={actionLoading} className="bg-green-600 hover:bg-green-700"><UserCheck className="h-4 w-4 mr-2" />Accept</Button>
            <Button variant="outline" onClick={handleRejectFriendRequest} disabled={actionLoading} className="text-red-600 hover:text-red-700 hover:bg-red-50"><UserX className="h-4 w-4 mr-2" />Decline</Button>
          </div>
        );
      case 'accepted':
        return <Button variant="outline" onClick={handleRemoveFriend} disabled={actionLoading} className="text-red-600 hover:text-red-700 hover:bg-red-50">Remove Friend</Button>;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold text-gray-900 ml-4">Profile</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="bg-brown-600 h-24"></div>
        <div className="px-4 pb-4 relative">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden relative bg-white">
              {profileUser.profile_image_url ? <Image src={profileUser.profile_image_url} alt={displayName} fill className="object-cover"/> : <div className="h-full w-full bg-gray-200 flex items-center justify-center"><UserIcon className="h-12 w-12 text-gray-500" /></div>}
            </div>
          </div>
          <div className="pt-16 text-center">
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-600">@{profileUser.username}</p>
            {profileUser.bio && <p className="mt-2 text-gray-700 text-center">{profileUser.bio}</p>}
            <div className="mt-4 flex justify-center">{renderFriendshipButton()}</div>
            <div className="mt-4 flex justify-center gap-8">
              <div className="rounded-lg p-2">
                <Stat icon={<Users className="h-4 w-4 text-brown-600" />} value={friendsCount} label="Friends" />
              </div>
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
          {userRatings.length > 0 ? userRatings.map((rating) => <RatingCard key={rating.id} rating={rating} />) : <div className="text-center py-8 bg-white rounded-lg shadow-md"><p className="text-gray-500">No ratings yet.</p></div>}
        </div>
      )}
      {activeTab === "beans" && <div className="text-center py-8 bg-white rounded-lg shadow-md"><p className="text-gray-500">Favorite beans feature coming soon!</p></div>}
    </div>
  );
}
