
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/router";
import ratingsService from "@/services/ratingsService";
import commentsService from "@/services/commentsService";
import { likesService } from "@/services/likesService";
import userService from "@/services/userService";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Global cleanup on route changes and app unmount
  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Cancel all pending requests when navigating
      try {
        ratingsService.cancelAllRequests();
        commentsService.cancelAllRequests();
        likesService.cancelAllRequests();
        userService.cancelAllRequests();
      } catch (error) {
        console.warn("Error cancelling requests during navigation:", error);
      }
    };

    const handleRouteChangeComplete = () => {
      // Clean up any remaining requests after route change
      setTimeout(() => {
        try {
          ratingsService.cancelAllRequests();
          commentsService.cancelAllRequests();
          likesService.cancelAllRequests();
          userService.cancelAllRequests();
        } catch (error) {
          console.warn("Error in post-navigation cleanup:", error);
        }
      }, 100);
    };

    const handleBeforeUnload = () => {
      // Cancel all requests before page unload
      try {
        ratingsService.cancelAllRequests();
        commentsService.cancelAllRequests();
        likesService.cancelAllRequests();
        userService.cancelAllRequests();
      } catch (error) {
        console.warn("Error cancelling requests before unload:", error);
      }
    };

    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Request timeout') || 
          event.reason?.message?.includes('Request cancelled') ||
          event.reason?.name === 'AbortError') {
        // Suppress timeout and cancellation errors from appearing in console
        event.preventDefault();
        console.debug("Request cancelled or timed out:", event.reason?.message);
      }
    };

    // Add event listeners
    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeComplete);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeComplete);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      
      // Final cleanup
      try {
        ratingsService.cancelAllRequests();
        commentsService.cancelAllRequests();
        likesService.cancelAllRequests();
        userService.cancelAllRequests();
      } catch (error) {
        console.warn("Error in final cleanup:", error);
      }
    };
  }, [router.events]);

  // Periodic cleanup of stale requests (every 30 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      try {
        // Log request counts for debugging
        const activeRequests = {
          ratings: ratingsService.getActiveRequestCount(),
          comments: commentsService.getActiveRequestCount(),
          likes: likesService.getActiveRequestCount(),
          users: userService.getActiveRequestCount()
        };

        const totalActive = Object.values(activeRequests).reduce((sum, count) => sum + count, 0);
        
        if (totalActive > 20) {
          console.warn("High number of active requests detected, performing cleanup:", activeRequests);
          ratingsService.cancelAllRequests();
          commentsService.cancelAllRequests();
          likesService.cancelAllRequests();
          userService.cancelAllRequests();
        }
      } catch (error) {
        console.warn("Error during periodic cleanup:", error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
