
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Eye, EyeOff, Mail, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import Link from "next/link";

export default function AccountSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Email change state
  const [emailData, setEmailData] = useState({
    newEmail: "",
    confirmEmail: ""
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }
  }, [user, loading, router]);

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
    setEmailMessage("");
    setEmailSuccess(false);
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordMessage("");
    setPasswordSuccess(false);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 10) {
      errors.push("Password must be at least 10 characters long");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailData.newEmail || !emailData.confirmEmail) {
      setEmailMessage("Please fill in all email fields");
      return;
    }

    if (!emailData.newEmail.includes("@")) {
      setEmailMessage("Please enter a valid email address");
      return;
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      setEmailMessage("Email addresses do not match");
      return;
    }

    if (emailData.newEmail === user?.email) {
      setEmailMessage("New email must be different from current email");
      return;
    }

    setEmailLoading(true);
    setEmailMessage("");

    try {
      await authService.changeEmail(emailData.newEmail);
      setEmailSuccess(true);
      setEmailMessage("Email change confirmation sent! Please check your new email address and click the confirmation link.");
      setEmailData({ newEmail: "", confirmEmail: "" });
    } catch (error: any) {
      console.error("Email change error:", error);
      
      let errorMessage = "Failed to change email. Please try again.";
      
      if (error.message?.includes("already registered") || error.message?.includes("already exists")) {
        errorMessage = "An account with this email address already exists.";
      } else if (error.message?.includes("invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "Too many email change attempts. Please wait a few minutes before trying again.";
      }
      
      setEmailMessage(errorMessage);
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("Passwords do not match");
      return;
    }

    const passwordErrors = validatePassword(passwordData.newPassword);
    if (passwordErrors.length > 0) {
      setPasswordMessage(passwordErrors[0]);
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage("");

    try {
      await authService.changePassword(passwordData.newPassword);
      setPasswordSuccess(true);
      setPasswordMessage("Password changed successfully!");
      setPasswordData({ newPassword: "", confirmPassword: "" });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordMessage("");
        setPasswordSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error("Password change error:", error);
      
      let errorMessage = "Failed to change password. Please try again.";
      
      if (error.message?.includes("session_not_found")) {
        errorMessage = "Your session has expired. Please sign in again.";
      } else if (error.message?.includes("weak_password")) {
        errorMessage = "Password must be at least 10 characters long and include uppercase, lowercase, numbers, and special characters.";
      }
      
      setPasswordMessage(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="BeanRate - Loading...">
        <div className="max-w-md mx-auto flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title="BeanRate - Account Settings">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Email Change Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Change Email Address
              </CardTitle>
              <p className="text-sm text-gray-600">
                Current email: <strong>{user.email}</strong>
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {emailMessage && (
                  <Alert className={emailSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <div className="flex items-center">
                      {emailSuccess ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                      )}
                      <AlertDescription className={emailSuccess ? "text-green-700" : "text-red-700"}>
                        {emailMessage}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email Address</Label>
                  <Input
                    id="newEmail"
                    name="newEmail"
                    type="email"
                    placeholder="Enter new email address"
                    value={emailData.newEmail}
                    onChange={handleEmailInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">Confirm New Email</Label>
                  <Input
                    id="confirmEmail"
                    name="confirmEmail"
                    type="email"
                    placeholder="Confirm new email address"
                    value={emailData.confirmEmail}
                    onChange={handleEmailInputChange}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-brown-600 hover:bg-brown-700"
                  disabled={emailLoading}
                >
                  {emailLoading ? "Sending Confirmation..." : "Change Email Address"}
                </Button>

                <p className="text-xs text-gray-500">
                  You'll receive a confirmation email at your new address. Click the link to complete the change.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Change Password
              </CardTitle>
              <p className="text-sm text-gray-600">
                Update your account password for better security
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordMessage && (
                  <Alert className={passwordSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <div className="flex items-center">
                      {passwordSuccess ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                      )}
                      <AlertDescription className={passwordSuccess ? "text-green-700" : "text-red-700"}>
                        {passwordMessage}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Password must include:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>At least 10 characters</li>
                      <li>Uppercase and lowercase letters</li>
                      <li>At least one number</li>
                      <li>At least one special character</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-brown-600 hover:bg-brown-700"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/profile/settings">
                <Button variant="outline" className="w-full justify-start">
                  Edit Profile Information
                </Button>
              </Link>
              
              <Link href="/auth/forgot-password">
                <Button variant="outline" className="w-full justify-start">
                  Reset Password via Email
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
