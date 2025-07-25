import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Coffee, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if we have auth tokens in the URL (from email link)
        const { access_token, refresh_token, error, error_description } = router.query;
        
        if (error) {
          console.error('URL contains error:', error, error_description);
          setStatus('error');
          
          if (error === 'access_denied' || error_description?.includes('expired')) {
            setErrorMessage('The confirmation link has expired. Please request a new confirmation email.');
          } else {
            setErrorMessage(error_description as string || 'Failed to confirm your account');
          }
          return;
        }

        if (access_token && refresh_token) {
          // Set the session using the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setStatus('error');
            setErrorMessage(sessionError.message || 'Failed to confirm your account');
            return;
          }

          if (data.session) {
            setStatus('success');
            setTimeout(() => {
              router.push('/auth/account-verified');
            }, 1500);
          } else {
            setStatus('error');
            setErrorMessage('Could not establish session. Please try clicking the confirmation link again.');
          }
        } else {
          // Fallback: check current session
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session check error:', sessionError);
            setStatus('error');
            setErrorMessage(sessionError.message || 'Failed to confirm your account');
            return;
          }

          if (data.session) {
            setStatus('success');
            setTimeout(() => {
              router.push('/auth/account-verified');
            }, 1500);
          } else {
            setStatus('error');
            setErrorMessage('No confirmation data found. Please try clicking the confirmation link in your email again.');
          }
        }
      } catch (error: any) {
        console.error('Unexpected error during confirmation:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    if (router.isReady) {
      handleEmailConfirmation();
    }
  }, [router.isReady, router.query, router]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {status === 'loading' && (
                  <div className="relative">
                    <Coffee className="h-16 w-16 text-amber-600" />
                    <Loader2 className="h-8 w-8 text-blue-600 absolute -top-2 -right-2 animate-spin" />
                  </div>
                )}
                {status === 'success' && (
                  <div className="bg-green-100 rounded-full p-4">
                    <Coffee className="h-16 w-16 text-green-600" />
                  </div>
                )}
                {status === 'error' && (
                  <div className="bg-red-100 rounded-full p-4">
                    <AlertCircle className="h-16 w-16 text-red-600" />
                  </div>
                )}
              </div>
              
              <CardTitle className="text-2xl font-bold text-gray-900">
                {status === 'loading' && 'Confirming Your Account...'}
                {status === 'success' && 'Account Confirmed!'}
                {status === 'error' && 'Confirmation Failed'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              {status === 'loading' && (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Please wait while we verify your email address...
                  </p>
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                  </div>
                </div>
              )}
              
              {status === 'success' && (
                <div className="space-y-3">
                  <p className="text-green-700 font-medium">
                    Great! Your email has been verified.
                  </p>
                  <p className="text-gray-600 text-sm">
                    Redirecting you to complete your setup...
                  </p>
                </div>
              )}
              
              {status === 'error' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                      {errorMessage}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                      You can try the following options:
                    </p>
                    <div className="space-y-2">
                      <Link href="/auth/create-account">
                        <Button variant="outline" className="w-full">
                          Request New Confirmation Email
                        </Button>
                      </Link>
                      <Link href="/auth/login">
                        <Button variant="ghost" className="w-full">
                          Try Signing In
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
