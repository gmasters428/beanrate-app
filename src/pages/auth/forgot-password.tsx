
import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail } from "lucide-react";
import { authService } from "@/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Layout title="BeanRate - Password Reset Sent">
        <div className="max-w-md mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-brown-600">Check Your Email</CardTitle>
              <p className="text-gray-600">We've sent password reset instructions to your email</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-500">
                We sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </p>
              
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="text-sm text-brown-600 hover:text-brown-700 font-medium"
                >
                  Try a different email address
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="BeanRate - Forgot Password">
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-brown-600">Reset Your Password</CardTitle>
            <p className="text-gray-600">Enter your email to receive reset instructions</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-brown-600 hover:bg-brown-700"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-brown-600 hover:text-brown-700 font-medium inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
