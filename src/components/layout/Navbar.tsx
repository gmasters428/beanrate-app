
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Coffee, Search, User, Home } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="hidden md:flex items-center">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Coffee className="h-6 w-6 text-brown-600" />
                <span className="text-xl font-bold text-brown-600">BeanRate</span>
              </div>
            </Link>
          </div>

          <div className="flex justify-around w-full md:w-auto md:ml-auto">
            <Link href="/">
              <div className={`flex flex-col items-center px-3 py-2 ${isActive("/") ? "text-brown-600" : "text-gray-500 hover:text-brown-600"}`}>
                <Home className="h-6 w-6" />
                <span className="text-xs mt-1">Home</span>
              </div>
            </Link>

            <Link href="/search">
              <div className={`flex flex-col items-center px-3 py-2 ${isActive("/search") ? "text-brown-600" : "text-gray-500 hover:text-brown-600"}`}>
                <Search className="h-6 w-6" />
                <span className="text-xs mt-1">Search</span>
              </div>
            </Link>

            <Link href="/rate">
              <div className="flex flex-col items-center px-3 py-2 text-gray-500 hover:text-brown-600">
                <div className="bg-brown-600 text-white rounded-full p-2">
                  <Coffee className="h-5 w-5" />
                </div>
                <span className="text-xs mt-1">Rate</span>
              </div>
            </Link>

            <Link href="/profile">
              <div className={`flex flex-col items-center px-3 py-2 ${isActive("/profile") ? "text-brown-600" : "text-gray-500 hover:text-brown-600"}`}>
                <User className="h-6 w-6" />
                <span className="text-xs mt-1">Profile</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
