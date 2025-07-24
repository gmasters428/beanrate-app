
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, Coffee, LogIn, Sparkles } from "lucide-react";

export default function AccountVerifiedPage() {
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoginRedirect = () => {
    router.push("/auth/login?verified=true");
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm relative overflow-hidden">
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 animate-bounce">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="absolute top-8 right-6 animate-bounce delay-100">
                  <Sparkles className="h-3 w-3 text-pink-400" />
                </div>
                <div className="absolute top-12 left-1/2 animate-bounce delay-200">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <div className="absolute top-6 right-1/4 animate-bounce delay-300">
                  <Sparkles className="h-3 w-3 text-green-400" />
                </div>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="bg-green-100 rounded-full p-4">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                  <Coffee className="h-8 w-8 text-amber-600 absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Account Verified!
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Welcome to the coffee community! ☕️
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">You're All Set!</h3>
                  <p className="text-sm text-green-700">
                    Your account has been successfully verified. You've <em>bean</em> great! 
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-gray-600">
                    Ready to start rating some amazing coffee beans?
                  </p>
                  
                  <Button
                    onClick={handleLoginRedirect}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In to Your Account
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>🌟 Discover new coffee beans</p>
                  <p>⭐ Rate and review your favorites</p>
                  <p>👥 Connect with fellow coffee enthusiasts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Need help getting started?{" "}
              <Link href="/" className="font-medium text-amber-600 hover:text-amber-500">
                Visit our homepage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
