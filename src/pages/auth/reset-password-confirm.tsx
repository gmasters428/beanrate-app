import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    const handlePasswordReset = async () => {
      // Check for error parameters in the URL hash
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const error = params.get('error');
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');

        if (error) {
          console.error("Password reset error from URL:", { error, errorCode, errorDescription });
          
          let userFriendlyError = "The password reset link is invalid or has expired.";
          
          if (errorCode === 'otp_expired') {
            userFriendlyError = "The password reset link has expired. Please request a new one.";
          } else if (errorCode === 'access_denied') {
            userFriendlyError = "Access denied. The password reset link may be invalid or already used.";
          } else if (errorDescription) {
            userFriendlyError = decodeURIComponent(errorDescription);
          }
          
          setTokenError(userFriendlyError);
          setIsValidating(false);
          return;
        }

        // Check for access token and refresh token
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          try {
            // Set the session with the tokens from the URL
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              console.error("Session error:", sessionError);
              setTokenError("Failed to validate reset link. Please try requesting a new password reset.");
            } else if (data.session) {
              console.log("✅ Password reset session established");
              // Clear the URL hash to remove tokens from browser history
              window.history.replaceState(null, '', window.location.pathname);
            } else {
              setTokenError("Invalid reset link. Please request a new password reset.");
            }
          } catch (err) {
            console.error("Error setting session:", err);
            setTokenError("Failed to process reset link. Please try again.");
          }
        } else {
          setTokenError("Invalid reset link format. Please request a new password reset.");
        }
      } else {
        // No hash parameters, check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setTokenError("No valid reset session found. Please request a new password reset.");
        }
      }
      
      setIsValidating(false);
    };

    handlePasswordReset();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);

    } catch (error: any) {
      console.error("Password reset error:", error);
      
      let errorMessage = "Failed to reset password. Please try again.";
      
      if (error.message?.includes("session_not_found")) {
        errorMessage = "Your reset session has expired. Please request a new password reset.";
      } else if (error.message?.includes("weak_password")) {
        errorMessage = "Password must be at least 10 characters long and include uppercase, lowercase, numbers, and special characters.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-brown-600" />
            <p className="text-gray-600">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-brown-600">Reset Link Invalid</CardTitle>
            <p className="text-gray-600">There was a problem with your password reset link</p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{tokenError}</AlertDescription>
            </Alert>
            
            <p className="text-sm text-gray-500">
              This usually happens when:
            </p>
            <ul className="text-sm text-gray-500 text-left space-y-1">
              <li>• The reset link has expired (links expire after 1 hour)</li>
              <li>• The link has already been used</li>
              <li>• The link was copied incorrectly</li>
            </ul>
            
            <div className="pt-4 space-y-3">
              <Link href="/auth/forgot-password">
                <Button className="w-full bg-brown-600 hover:bg-brown-700">
                  Request New Reset Link
                </Button>
              </Link>
              
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-brown-600">Password Reset Complete</CardTitle>
            <p className="text-gray-600">Your password has been successfully updated</p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              You can now sign in with your new password.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to sign in page in a few seconds...
            </p>
            
            <div className="pt-4">
              <Link href="/auth/login">
                <Button className="w-full bg-brown-600 hover:bg-brown-700">
                  Sign In Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-brown-600">Set New Password</CardTitle>
          <p className="text-gray-600">Enter your new password below</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
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
              disabled={isLoading}
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-brown-600 hover:text-brown-700 font-medium">
              Need a new reset link?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
