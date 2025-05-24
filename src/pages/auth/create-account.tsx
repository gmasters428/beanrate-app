import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateAccountPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors([]);
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.username.trim()) {
      newErrors.push("Username is required");
    } else if (formData.username.length < 3) {
      newErrors.push("Username must be at least 3 characters");
    }

    if (!formData.email.trim()) {
      newErrors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.push("Please enter a valid email address");
    }

    if (!formData.password) {
      newErrors.push("Password is required");
    } else if (formData.password.length < 6) {
      newErrors.push("Password must be at least 6 characters");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.push("Passwords do not match");
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Mock account creation and email sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show email confirmation step
      setEmailSent(true);
      
      // Mock email confirmation delay
      setTimeout(async () => {
        // Create user object
        const newUser = {
          id: Date.now().toString(),
          username: formData.username,
          email: formData.email,
          name: formData.username,
          profileImage: null,
          bio: null,
          following: [],
          followers: [],
          preferences: {
            coffeeTypes: [],
            region: null,
            firstName: null,
            lastName: null
          }
        };
        
        // Use auth context login function
        login(newUser);
        
        // Redirect to profile page
        router.push("/profile");
      }, 2000);
      
    } catch (error) {
      setErrors(["Failed to create account. Please try again."]);
      setEmailSent(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Layout title="BeanRate - Email Confirmation">
        <div className="max-w-md mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
              <p className="text-gray-600">We've sent a confirmation email to</p>
              <p className="font-medium text-brown-600">{formData.email}</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    Confirming your email automatically... You'll be redirected to your profile shortly.
                  </AlertDescription>
                </Alert>
                
                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button 
                    onClick={() => setEmailSent(false)}
                    className="text-brown-600 hover:text-brown-700 font-medium"
                  >
                    try again
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="BeanRate - Create Account">
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-brown-600">Create Account</CardTitle>
            <p className="text-gray-600">Join the BeanRate community</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-brown-600 hover:text-brown-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}