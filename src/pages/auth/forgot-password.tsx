import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { emailService } from "@/services/emailService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

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
      console.log("🚀 Attempting password reset for:", email);
      const result = await authService.resetPassword(email);
      console.log("✅ Password reset result:", result);
      setSuccess(true);
    } catch (error: any) {
      console.error("❌ Password reset failed:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (error.message?.includes("User not found")) {
        errorMessage = "No account found with this email address. Please check your email or create a new account.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email address first before requesting a password reset.";
      } else if (error.message?.includes("Too many requests")) {
        errorMessage = "Too many password reset attempts. Please wait a few minutes before trying again.";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.originalError) {
        errorMessage = `${error.message} (Check browser console for details)`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostics = async () => {
    if (!email) {
      setError("Please enter an email address first");
      return;
    }

    setIsLoading(true);
    const results = {
      userExists: await emailService.checkUserExists(email),
      smtpTest: await emailService.testSMTPConnection(),
      passwordResetTest: await emailService.testPasswordResetEmail(email)
    };
    
    setDiagnostics(results);
    setShowDiagnostics(true);
    setIsLoading(false);
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
              
              <Alert className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Still not receiving emails?</strong><br />
                  • Check your spam/junk folder<br />
                  • Verify the email address is correct<br />
                  • Contact support if the issue persists
                </AlertDescription>
              </Alert>
              
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
                    setShowDiagnostics(false);
                    setDiagnostics(null);
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
                    setShowDiagnostics(false);
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

            {/* Diagnostics Section */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runDiagnostics}
                disabled={isLoading || !email}
                className="w-full text-xs"
              >
                {isLoading ? "Running Diagnostics..." : "🔧 Run Email Diagnostics"}
              </Button>
              
              {showDiagnostics && diagnostics && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Diagnostic Results:</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className={`flex items-center gap-2 p-2 rounded ${diagnostics.userExists.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      {diagnostics.userExists.success ? 
                        <CheckCircle className="h-3 w-3 text-green-600" /> : 
                        <AlertCircle className="h-3 w-3 text-red-600" />
                      }
                      <span className={diagnostics.userExists.success ? 'text-green-700' : 'text-red-700'}>
                        User Check: {diagnostics.userExists.message}
                      </span>
                    </div>
                    
                    <div className={`flex items-center gap-2 p-2 rounded ${diagnostics.smtpTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      {diagnostics.smtpTest.success ? 
                        <CheckCircle className="h-3 w-3 text-green-600" /> : 
                        <AlertCircle className="h-3 w-3 text-red-600" />
                      }
                      <span className={diagnostics.smtpTest.success ? 'text-green-700' : 'text-red-700'}>
                        SMTP: {diagnostics.smtpTest.message}
                      </span>
                    </div>
                    
                    <div className={`flex items-center gap-2 p-2 rounded ${diagnostics.passwordResetTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      {diagnostics.passwordResetTest.success ? 
                        <CheckCircle className="h-3 w-3 text-green-600" /> : 
                        <AlertCircle className="h-3 w-3 text-red-600" />
                      }
                      <span className={diagnostics.passwordResetTest.success ? 'text-green-700' : 'text-red-700'}>
                        Email Send: {diagnostics.passwordResetTest.message}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
