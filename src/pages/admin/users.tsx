import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserX, UserPlus, AlertTriangle } from "lucide-react";
import Link from "next/link";
import authService from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

export default function UserManagementPage() {
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

  const handleAdvancedDebug = async () => {
    if (!email) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      const info = await authService.advancedDebugEmail(email);
      setDebugInfo(info);
      setMessage("Advanced debug completed successfully");
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
      await handleDebugEmail();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceCleanup = async () => {
    if (!email) return;
    
    if (!confirm(`⚠️ FORCE CLEANUP: This will aggressively clean all data for ${email}. Continue?`)) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      const result = await authService.forceCleanupEmail(email);
      setMessage(result.message || `Force cleanup completed: ${result.success ? 'Success' : 'Failed'}`);
      await handleAdvancedDebug();
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

  const handleNuclearReset = async () => {
    if (!confirm("⚠️ NUCLEAR RESET: This will delete ALL users and data. Are you absolutely sure?")) return;
    const confirmationText = prompt("This action cannot be undone. Type 'RESET' to confirm.");
    if (confirmationText !== "RESET") {
      setMessage("Nuclear reset cancelled. Confirmation text did not match.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      const result = await authService.nuclearAuthReset();
      setMessage(result.message);
      setDebugInfo(null);
      setAllUsers([]);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuperNuclearReset = async () => {
    if (!confirm("⚠️⚠️ SUPER NUCLEAR RESET: This will delete EVERYTHING with extreme prejudice. Are you absolutely sure?")) return;
    const confirmationText = prompt("This action cannot be undone and will clear ALL data. Type 'SUPER-RESET' to confirm.");
    if (confirmationText !== "SUPER-RESET") {
      setMessage("Super nuclear reset cancelled. Confirmation text did not match.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      const result = await authService.superNuclearReset();
      setMessage(result.message);
      setDebugInfo(null);
      setAllUsers([]);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSignup = async () => {
    if (!email) {
      setMessage("Please enter an email address first");
      return;
    }
    
    const password = prompt("Enter password for force signup:");
    const username = prompt("Enter username for force signup:");
    
    if (!password || !username) {
      setMessage("Password and username are required");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      const result = await authService.forceSignUp(email, password, username);
      setMessage(`Force signup successful for ${email}`);
      await handleDebugEmail();
    } catch (error: any) {
      setMessage(`Force signup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListAllUsers = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const { data: publicUsers } = await supabase.from('users').select('*');
      
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
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;
      
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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <p className="text-gray-600">Debug authentication issues and manage user accounts</p>
      </div>
      
      {message && (
        <Alert className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Email Debug Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Debug Specific User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email to debug"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleAdvancedDebug} disabled={loading}>
                Advanced Debug
              </Button>
              <Button onClick={handleForceCleanup} disabled={loading} variant="destructive">
                Force Cleanup
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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Global User Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleListAllUsers} disabled={loading}>
                <Users className="h-4 w-4 mr-2" />
                List All Users
              </Button>
              <Button onClick={handleCleanupAll} disabled={loading} variant="destructive">
                <UserX className="h-4 w-4 mr-2" />
                Clean All Orphaned
              </Button>
              <Button onClick={handleForceSignup} disabled={loading} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Force Signup (Email Above)
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </h4>
              <div className="space-y-2">
                <Button onClick={handleNuclearReset} disabled={loading} variant="destructive" className="bg-red-600 hover:bg-red-700 w-full">
                  💥 Nuclear Reset (Delete Everything)
                </Button>
                <Button onClick={handleSuperNuclearReset} disabled={loading} variant="destructive" className="bg-red-800 hover:bg-red-900 w-full">
                  💥💥 SUPER Nuclear Reset (Extreme Cleanup)
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Super Nuclear will use multiple strategies to completely eliminate all traces of user data.
              </p>
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
