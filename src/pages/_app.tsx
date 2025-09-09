
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";
import { ratingsService } from "@/services/ratingsService";
import { commentsService } from "@/services/commentsService";
import { likesService } from "@/services/likesService";
import { userService } from "@/services/userService";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    let isActive = true;

    const handleBeforeUnload = () => {
      // Note: Request cancellation logic removed as services don't support it
      console.log('App is closing - cleanup complete');
    };

    const handleVisibilityChange = () => {
      if (!isActive) return;
      
      if (document.visibilityState === "hidden") {
        // Background state - no action needed
        console.log('App went to background');
      } else if (document.visibilityState === "visible") {
        // Foreground state - no action needed  
        console.log('App came to foreground');
      }
    };

    const handleFocus = () => {
      if (!isActive) return;
      // Focus state - no action needed
      console.log('App gained focus');
    };

    const handleBlur = () => {
      if (!isActive) return;
      // Blur state - no action needed
      console.log('App lost focus');
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      isActive = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
        <Toaster />
      </Layout>
    </AuthProvider>
  );
}