
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
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
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
