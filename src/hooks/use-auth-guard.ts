import { useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

type RequireAuthOptions = {
  redirectTo?: string;
  onUnauthed?: () => void;
};

export const useAuthGuard = () => {
  const { user, loading, status } = useAuth();
  const router = useRouter();

  const isAuthenticated = Boolean(user);

  const requireAuth = useCallback(
    (options?: RequireAuthOptions) => {
      if (isAuthenticated) return true;
      options?.onUnauthed?.();
      if (options?.redirectTo) {
        router.push(options.redirectTo);
      }
      return false;
    },
    [isAuthenticated, router]
  );

  return { user, loading, status, isAuthenticated, requireAuth };
};
