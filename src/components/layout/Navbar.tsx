import Link from "next/link";
import { useRouter } from "next/router";
import { Coffee, Search, User, Menu, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/adminUtils";

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-amber-600" />
              <span className="text-xl font-bold text-gray-900">BeanRate</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/search" className="text-gray-700 hover:text-amber-600">
              <Search className="h-5 w-5" />
            </Link>
            
            {!loading && user && (
              <>
                <Link href="/rate" className="text-gray-700 hover:text-amber-600">
                  Rate Coffee
                </Link>
                {isAdmin(user.email) && (
                  <Link href="/admin" className="text-gray-700 hover:text-amber-600">
                    <Shield className="h-5 w-5" />
                  </Link>
                )}
                <Link href="/profile" className="text-gray-700 hover:text-amber-600">
                  <User className="h-5 w-5" />
                </Link>
              </>
            )}
            
            {!loading && !user && (
              <Link href="/auth/login" className="text-gray-700 hover:text-amber-600">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
