
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/globals.css";
import { ratingsService } from "@/services/ratingsService";
import { commentsService } from "@/services/commentsService";
import { likesService } from "@/services/likesService";
import { userService } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const getMaskedProjectRef = (url?: string) => {
  if (!url) return null;
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/i);
  if (!match) return null;
  const ref = match[1];
  if (ref.length <= 8) return ref;
  return `${ref.slice(0, 4)}...${ref.slice(-4)}`;
};

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    let isActive = true;
    let warmupInFlight = false;
    let lastWarmupAt = 0;
    let lastWarmupToastAt = 0;

    const handleBeforeUnload = () => {
      // Note: Request cancellation logic removed as services don't support it
      console.log('App is closing - cleanup complete');
    };

    if (process.env.NODE_ENV !== "production") {
      const maskedRef = getMaskedProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.debug(`[App] Supabase env project ref: ${maskedRef ?? "unknown"}`);
    }

    const runWarmup = async (source: string) => {
      const now = Date.now();
      if (warmupInFlight || now - lastWarmupAt < 5000) {
        return;
      }
      warmupInFlight = true;
      lastWarmupAt = now;

      if (process.env.NODE_ENV !== "production") {
        console.debug(`[Warmup] Supabase session check (${source})`);
      }

      try {
        await supabase.auth.getSession();
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[Warmup] Supabase session ok (${source})`);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[Warmup] Supabase session failed", error);
        }
        if (now - lastWarmupToastAt > 60000) {
          toast({
            title: "Reconnecting...",
            description: "We’re waking the connection. If the feed doesn’t load, tap Try Again.",
          });
          lastWarmupToastAt = now;
        }
      } finally {
        warmupInFlight = false;
      }
    };

    const handleVisibilityChange = () => {
      if (!isActive) return;
      
      if (document.visibilityState === "hidden") {
        // Background state - no action needed
        console.log('App went to background');
      } else if (document.visibilityState === "visible") {
        // Foreground state - no action needed  
        console.log('App came to foreground');
        void runWarmup("visibility");
      }
    };

    const handleFocus = () => {
      if (!isActive) return;
      // Focus state - no action needed
      console.log('App gained focus');
      void runWarmup("focus");
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
        <SpeedInsights />
      </Layout>
    </AuthProvider>
  );
}
