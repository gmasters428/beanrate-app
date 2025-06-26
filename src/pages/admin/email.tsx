
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Send, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";

export default function EmailTestingPage() {
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("BeanRate Test Email");
  const [testMessage, setTestMessage] = useState("This is a test email from your BeanRate admin panel.");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setMessage("Please enter a test email address");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setEmailStatus("idle");
    
    try {
      // Try to send a password reset email as a test
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error("Test email error:", error);
        setEmailStatus("error");
        setMessage(`Test email failed: ${error.message}`);
      } else {
        setEmailStatus("success");
        setMessage(`Test email sent successfully to ${testEmail}! Check your inbox for a password reset email.`);
      }
    } catch (error: any) {
      console.error("Test email exception:", error);
      setEmailStatus("error");
      setMessage(`Test email failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSignupEmail = async () => {
    if (!testEmail) {
      setMessage("Please enter a test email address");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setEmailStatus("idle");
    
    try {
      // Try to resend confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        console.error("Signup email test error:", error);
        setEmailStatus("error");
        setMessage(`Signup email test failed: ${error.message}`);
      } else {
        setEmailStatus("success");
        setMessage(`Signup confirmation email sent to ${testEmail}! Check your inbox.`);
      }
    } catch (error: any) {
      console.error("Signup email test exception:", error);
      setEmailStatus("error");
      setMessage(`Signup email test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
          <Mail className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Email Testing</h1>
        </div>
        <p className="text-gray-600">Test SMTP configuration and email delivery</p>
      </div>
      
      {message && (
        <Alert className="mb-6">
          <div className="flex items-center gap-2">
            {emailStatus === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
            {emailStatus === "error" && <XCircle className="h-4 w-4 text-red-500" />}
            <AlertDescription>{message}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Email Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              SMTP Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Email Provider</p>
                <Badge variant="outline">Supabase Auth</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Configuration</p>
                <Badge variant="secondary">Managed by Supabase</Badge>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Email delivery is handled by Supabase Auth. Make sure you have configured your SMTP settings in the Supabase dashboard under Authentication → Settings → SMTP.</p>
            </div>
          </CardContent>
        </Card>

        {/* Test Email Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Emails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter email to test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleSendTestEmail} disabled={loading}>
                  <Mail className="h-4 w-4 mr-2" />
                  Test Password Reset Email
                </Button>
                <Button onClick={handleTestSignupEmail} disabled={loading} variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Test Signup Confirmation Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Available Email Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">Signup Confirmation</h5>
                    <p className="text-sm text-gray-600">Sent when users create new accounts</p>
                    <Badge variant="outline" className="mt-1">Auto-triggered</Badge>
                  </div>
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">Password Reset</h5>
                    <p className="text-sm text-gray-600">Sent when users request password reset</p>
                    <Badge variant="outline" className="mt-1">User-triggered</Badge>
                  </div>
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">Email Change</h5>
                    <p className="text-sm text-gray-600">Sent when users change their email</p>
                    <Badge variant="outline" className="mt-1">User-triggered</Badge>
                  </div>
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">Magic Link</h5>
                    <p className="text-sm text-gray-600">Passwordless login emails</p>
                    <Badge variant="secondary" className="mt-1">Not configured</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Common Issues</h4>
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                  <li>• Check SMTP settings in Supabase dashboard</li>
                  <li>• Verify sender email is authenticated</li>
                  <li>• Check spam/junk folders</li>
                  <li>• Ensure correct SMTP port (usually 587 or 465)</li>
                  <li>• Verify SMTP credentials are correct</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Next Steps</h4>
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                  <li>• Configure custom SMTP in Supabase dashboard</li>
                  <li>• Set up custom email templates</li>
                  <li>• Configure sender domain authentication</li>
                  <li>• Monitor email delivery rates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
