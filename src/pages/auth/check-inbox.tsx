import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, Coffee, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";

export default function CheckInboxPage() {
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const emailFromQuery = router.query.email as string;
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [router.query]);

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please provide your email address to resend confirmation.",
        variant: "destructive"
      });
      return;
    }

    setResending(true);
    try {
      await authService.resendConfirmation(email);
      toast({
        title: "Confirmation email sent!",
        description: "We've sent another confirmation email to your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend email",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Coffee className="h-16 w-16 text-amber-600" />
                <Mail className="h-8 w-8 text-blue-600 absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              One Last Step!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              We're absolutely <span className="font-semibold text-amber-700">buzzing</span> to have you join our community!
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">Check Your Email</h3>
                <p className="text-sm text-amber-700">
                  We've sent a confirmation link to:
                </p>
                {email && (
                  <p className="font-mono text-sm bg-white px-3 py-1 rounded mt-2 text-gray-800">
                    {email}
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  Please check your inbox (and spam folder, just in case!) to verify your account.
                </p>
                <p className="font-medium text-amber-700">
                  This is going to be <em>brew-tiful</em>! ☕️
                </p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-xs text-gray-500">
                  Didn't receive the email?
                </p>
                <Button
                  onClick={handleResendConfirmation}
                  disabled={resending || !email}
                  variant="outline"
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Confirmation Email
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <Link href="/auth/create-account">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign Up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already confirmed your account?{" "}
            <Link href="/auth/login" className="font-medium text-amber-600 hover:text-amber-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
