
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
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
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // If no session, redirect to forgot password page
        router.push("/auth/forgot-password");
      }
    };

    checkSession();
  }, [router]);

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
    
    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
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
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <Layout title="BeanRate - Reset Password">
        <div className="max-w-md mx-auto mt-8">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout title="BeanRate - Password Reset Complete">
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
      </Layout>
    );
  }

  return (
    <Layout title="BeanRate - Reset Password">
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
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
