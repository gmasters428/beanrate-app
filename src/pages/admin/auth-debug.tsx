
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import authService from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

export default function AuthDebugPage() {
  const [email, setEmail] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const handleDebugEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      const info = await authService.debugAuthState(email);
      setDebugInfo(info);
      setMessage("Debug completed successfully");
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      const result = await authService.clearOrphanedAuthData(email);
      setMessage(result.message);
      // Refresh debug info
      await handleDebugEmail();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupAll = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const result = await authService.clearOrphanedAuthData();
      setMessage(result.message);
      setDebugInfo(null);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListAllUsers = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      // Get auth users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      // Get public users
      const { data: publicUsers } = await supabase
        .from('users')
        .select('*');
      
      const combinedUsers = (authUsers?.users || []).map((authUser: any) => {
        const publicUser = publicUsers?.find(p => p.id === authUser.id);
        return {
          ...authUser,
          hasPublicProfile: !!publicUser,
          publicProfile: publicUser,
          isOrphaned: !publicUser
        };
      });
      
      setAllUsers(combinedUsers);
      setMessage(`Found ${combinedUsers.length} auth users, ${combinedUsers.filter(u => u.isOrphaned).length} orphaned`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return;
    
    setLoading(true);
    
    try {
      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;
      
      // Delete from public tables
      await supabase.from('users').delete().eq('id', userId);
      await supabase.from('user_preferences').delete().eq('user_id', userId);
      
      setMessage(`Successfully deleted user ${email}`);
      await handleListAllUsers();
    } catch (error: any) {
      setMessage(`Error deleting user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Auth Debug Tool</h1>
      
      {message && (
        <Alert className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Email Debug Section */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Specific Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email to debug"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleDebugEmail} disabled={loading}>
                Debug
              </Button>
              <Button onClick={handleCleanupEmail} disabled={loading} variant="destructive">
                Clean Email
              </Button>
            </div>
            
            {debugInfo && (
              <div className="space-y-2">
                <h3 className="font-semibold">Debug Results:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Email: {debugInfo.email}</div>
                  <div>Auth User Exists: <Badge variant={debugInfo.authUserExists ? "default" : "secondary"}>{debugInfo.authUserExists ? "Yes" : "No"}</Badge></div>
                  <div>Auth User Confirmed: <Badge variant={debugInfo.authUserConfirmed ? "default" : "secondary"}>{debugInfo.authUserConfirmed ? "Yes" : "No"}</Badge></div>
                  <div>Public User Exists: <Badge variant={debugInfo.publicUserExists ? "default" : "secondary"}>{debugInfo.publicUserExists ? "Yes" : "No"}</Badge></div>
                  <div>Current Session: <Badge variant={debugInfo.currentSession ? "default" : "secondary"}>{debugInfo.currentSession ? "Yes" : "No"}</Badge></div>
                  <div>Is Orphaned: <Badge variant={debugInfo.isOrphaned ? "destructive" : "default"}>{debugInfo.isOrphaned ? "Yes" : "No"}</Badge></div>
                  {debugInfo.authUserId && <div>Auth User ID: {debugInfo.authUserId}</div>}
                  {debugInfo.publicUserId && <div>Public User ID: {debugInfo.publicUserId}</div>}
                  {debugInfo.authUserCreatedAt && <div>Created: {new Date(debugInfo.authUserCreatedAt).toLocaleString()}</div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Global Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleListAllUsers} disabled={loading}>
                List All Users
              </Button>
              <Button onClick={handleCleanupAll} disabled={loading} variant="destructive">
                Clean All Orphaned
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Users List */}
        {allUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Users ({allUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                          {user.email_confirmed_at ? "Confirmed" : "Unconfirmed"}
                        </Badge>
                        <Badge variant={user.hasPublicProfile ? "default" : "destructive"}>
                          {user.hasPublicProfile ? "Has Profile" : "Orphaned"}
                        </Badge>
                        {user.publicProfile?.username && (
                          <Badge variant="outline">@{user.publicProfile.username}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {new Date(user.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
