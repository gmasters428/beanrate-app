import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { ArrowLeft, User as UserIcon, UserCheck, UserX } from "lucide-react";
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

export default function FriendRequestsPage() {
  const { user, loading } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<UserWithProfile[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const loadPendingRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingRequests(true);
      const requests = await userService.getFriendRequests(user.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPendingRequests();
    }
  }, [user, loadPendingRequests]);

  const handleAcceptRequest = async (requesterId: string) => {
    if (!user) return;
    
    try {
      await userService.acceptFriendRequest(requesterId, user.id);
      setPendingRequests(pendingRequests.filter(request => request.id !== requesterId));
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    try {
      await userService.rejectFriendRequest(requesterId);
      setPendingRequests(pendingRequests.filter(request => request.id !== requesterId));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  if (loading || loadingRequests) {
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
        <h1 className="text-xl font-bold text-gray-900 ml-4">Friend Requests ({pendingRequests.length})</h1>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden relative bg-gray-200">
                    {request.profile_image_url ? (
                      <Image 
                        src={request.profile_image_url} 
                        alt={request.display_name || request.username} 
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
                      {request.display_name || request.username}
                    </h3>
                    <p className="text-sm text-gray-500">@{request.username}</p>
                    <p className="text-xs text-gray-400">Wants to be friends</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm"
                    onClick={() => handleAcceptRequest(request.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRejectRequest(request.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Decline
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
