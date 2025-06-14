import { supabase } from "@/integrations/supabase/client";

export interface EmailTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const emailService = {
  async testSMTPConnection(): Promise<EmailTestResult> {
    try {
      // Test by attempting to send a password reset email to a test address
      const testEmail = "test@example.com";
      const projectUrl = "https://3000-76626cd7-7354-447d-be3e-b61f3780c4d1.h1061.daytona.work";
      
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${projectUrl}/auth/reset-password`
      });

      if (error) {
        return {
          success: false,
          message: "SMTP configuration issue detected",
          details: error
        };
      }

      return {
        success: true,
        message: "SMTP connection appears to be working correctly"
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to test SMTP connection",
        details: error
      };
    }
  },

  async testPasswordResetEmail(email: string): Promise<EmailTestResult> {
    try {
      const projectUrl = "https://3000-76626cd7-7354-447d-be3e-b61f3780c4d1.h1061.daytona.work";
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${projectUrl}/auth/reset-password`
      });

      if (error) {
        return {
          success: false,
          message: "Failed to send password reset email",
          details: {
            error: error.message,
            code: error.status,
            hint: "Check if the email exists in your user database and SMTP is properly configured"
          }
        };
      }

      return {
        success: true,
        message: "Password reset email sent successfully",
        details: {
          email: email,
          redirectUrl: `${projectUrl}/auth/reset-password`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Error sending password reset email",
        details: error
      };
    }
  },

  async checkUserExists(email: string): Promise<EmailTestResult> {
    try {
      // Check if user exists by attempting to get user data
      // Note: This is a workaround since Supabase doesn't provide a direct way to check user existence
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://example.com" // Dummy URL for testing
      });

      // If no error, user likely exists
      if (!error) {
        return {
          success: true,
          message: "User exists in the database",
          details: { email }
        };
      }

      // Check specific error messages
      if (error.message?.includes("User not found") || error.message?.includes("Invalid email")) {
        return {
          success: false,
          message: "User does not exist in the database",
          details: { email, error: error.message }
        };
      }

      return {
        success: false,
        message: "Unable to verify user existence",
        details: { email, error: error.message }
      };
    } catch (error) {
      return {
        success: false,
        message: "Error checking user existence",
        details: error
      };
    }
  },

  async sendWelcomeEmail(email: string): Promise<EmailTestResult> {
    try {
      // This will trigger Supabase's built-in email confirmation
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        return {
          success: false,
          message: "Failed to send welcome email",
          details: error
        };
      }

      return {
        success: true,
        message: "Welcome email sent successfully"
      };
    } catch (error) {
      return {
        success: false,
        message: "Error sending welcome email",
        details: error
      };
    }
  },

  async checkEmailDeliveryStatus(email: string): Promise<EmailTestResult> {
    try {
      // Check if user exists and email is confirmed
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return {
          success: false,
          message: "Unable to check email status",
          details: error
        };
      }

      if (user && user.email === email) {
        return {
          success: true,
          message: user.email_confirmed_at 
            ? "Email confirmed successfully" 
            : "Email sent but not yet confirmed",
          details: {
            emailConfirmed: !!user.email_confirmed_at,
            confirmedAt: user.email_confirmed_at
          }
        };
      }

      return {
        success: false,
        message: "User not found or email mismatch"
      };
    } catch (error) {
      return {
        success: false,
        message: "Error checking email status",
        details: error
      };
    }
  }
};

export default emailService;
