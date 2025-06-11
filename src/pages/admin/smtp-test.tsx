
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { emailService, EmailTestResult } from "@/services/emailService";
import { useAuth } from "@/contexts/AuthContext";

export default function SMTPTestPage() {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState("");
  const [testResults, setTestResults] = useState<{
    connection?: EmailTestResult;
    welcome?: EmailTestResult;
    status?: EmailTestResult;
  }>({});
  const [isLoading, setIsLoading] = useState({
    connection: false,
    welcome: false,
    status: false
  });

  const handleConnectionTest = async () => {
    setIsLoading(prev => ({ ...prev, connection: true }));
    try {
      const result = await emailService.testSMTPConnection();
      setTestResults(prev => ({ ...prev, connection: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        connection: { 
          success: false, 
          message: "Test failed with error", 
          details: error 
        } 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, connection: false }));
    }
  };

  const handleWelcomeEmailTest = async () => {
    if (!testEmail) {
      alert("Please enter an email address");
      return;
    }

    setIsLoading(prev => ({ ...prev, welcome: true }));
    try {
      const result = await emailService.sendWelcomeEmail(testEmail);
      setTestResults(prev => ({ ...prev, welcome: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        welcome: { 
          success: false, 
          message: "Failed to send test email", 
          details: error 
        } 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, welcome: false }));
    }
  };

  const handleStatusCheck = async () => {
    if (!testEmail) {
      alert("Please enter an email address");
      return;
    }

    setIsLoading(prev => ({ ...prev, status: true }));
    try {
      const result = await emailService.checkEmailDeliveryStatus(testEmail);
      setTestResults(prev => ({ ...prev, status: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        status: { 
          success: false, 
          message: "Failed to check email status", 
          details: error 
        } 
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, status: false }));
    }
  };

  const getStatusIcon = (result?: EmailTestResult) => {
    if (!result) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    return result.success 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (result?: EmailTestResult) => {
    if (!result) return <Badge variant="secondary">Not Tested</Badge>;
    return result.success 
      ? <Badge className="bg-green-100 text-green-800">Success</Badge>
      : <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <Layout title="BeanRate - SMTP Configuration Test">
      <div className="max-w-4xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-brown-600" />
              SMTP Configuration Test
            </CardTitle>
            <p className="text-gray-600">
              Test your Supabase SMTP configuration to ensure emails are being sent correctly.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Test */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">1. SMTP Connection Test</h3>
                {getStatusBadge(testResults.connection)}
              </div>
              <p className="text-sm text-gray-600">
                Tests if Supabase can connect to your SMTP provider.
              </p>
              <Button 
                onClick={handleConnectionTest}
                disabled={isLoading.connection}
                className="bg-brown-600 hover:bg-brown-700"
              >
                {isLoading.connection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  "Test SMTP Connection"
                )}
              </Button>
              
              {testResults.connection && (
                <Alert className={testResults.connection.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.connection)}
                    <AlertDescription className={testResults.connection.success ? "text-green-700" : "text-red-700"}>
                      {testResults.connection.message}
                      {testResults.connection.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-medium">View Details</summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(testResults.connection.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Email Test */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">2. Welcome Email Test</h3>
                {getStatusBadge(testResults.welcome)}
              </div>
              <p className="text-sm text-gray-600">
                Send a test welcome email to verify email delivery.
              </p>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="testEmail">Test Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="Enter email to test"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleWelcomeEmailTest}
                    disabled={isLoading.welcome || !testEmail}
                    className="bg-brown-600 hover:bg-brown-700"
                  >
                    {isLoading.welcome ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Test Email"
                    )}
                  </Button>
                </div>
              </div>

              {testResults.welcome && (
                <Alert className={testResults.welcome.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.welcome)}
                    <AlertDescription className={testResults.welcome.success ? "text-green-700" : "text-red-700"}>
                      {testResults.welcome.message}
                      {testResults.welcome.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-medium">View Details</summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(testResults.welcome.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Status Check */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">3. Email Delivery Status</h3>
                {getStatusBadge(testResults.status)}
              </div>
              <p className="text-sm text-gray-600">
                Check if emails are being delivered and confirmed.
              </p>
              
              <Button 
                onClick={handleStatusCheck}
                disabled={isLoading.status || !testEmail}
                variant="outline"
              >
                {isLoading.status ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Email Status"
                )}
              </Button>

              {testResults.status && (
                <Alert className={testResults.status.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.status)}
                    <AlertDescription className={testResults.status.success ? "text-green-700" : "text-red-700"}>
                      {testResults.status.message}
                      {testResults.status.details && (
                        <div className="mt-2">
                          <p className="font-medium">Status Details:</p>
                          <ul className="list-disc list-inside text-sm">
                            <li>Email Confirmed: {testResults.status.details.emailConfirmed ? "Yes" : "No"}</li>
                            {testResults.status.details.confirmedAt && (
                              <li>Confirmed At: {new Date(testResults.status.details.confirmedAt).toLocaleString()}</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>Run the SMTP connection test to verify your configuration</li>
                <li>Enter your email address and send a test welcome email</li>
                <li>Check your inbox (and spam folder) for the test email</li>
                <li>Use the status check to verify email confirmation</li>
                <li>Once confirmed working, test creating a new user account</li>
              </ol>
            </div>

            {/* Current User Info */}
            {user && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Current User Info:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Name:</strong> {user.name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
