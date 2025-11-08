import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { ArrowLeft, User as UserIcon, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { userService, UserWithProfile } from "@/services/userService";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { NextApiRequest, NextApiResponse } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = getServerSupabase({ 
    req: context.req as unknown as NextApiRequest, 
    res: context.res as unknown as NextApiResponse 
  });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
}

export default function FriendsPage() {
  const { user, loading } = useAuth();
  const [friends, setFriends] = useState<UserWithProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingFriends(true);
      const friendsList = await userService.getFriends(user.id);
      setFriends(friendsList);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user, loadFriends]);

  const handleRemoveFriend = async (friendId: string, friendshipId: string) => {
    try {
      await userService.removeFriend(friendshipId);
      setFriends(friends.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  if (loading || loadingFriends) {
    return (
      <div className="max-w-md mx-auto flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/profile">
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 ml-4">Friends ({friends.length})</h1>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
          <p className="text-gray-500 mb-6">Start connecting with other coffee enthusiasts!</p>
          <Link href="/search">
            <Button className="bg-brown-600 hover:bg-brown-700">
              Find People
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div key={friend.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden relative bg-gray-200">
                    {friend.profile_image_url ? (
                      <Image 
                        src={friend.profile_image_url} 
                        alt={friend.display_name || friend.username} 
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
                      {friend.display_name || friend.username}
                    </h3>
                    <p className="text-sm text-gray-500">@{friend.username}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/profile/${friend.username?.replace(/^@/, '').toLowerCase()}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRemoveFriend(friend.id, friend.friendship_id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
