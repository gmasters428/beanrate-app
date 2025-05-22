
import Image from "next/image";
import Link from "next/link";
import { CoffeeBean } from "@/types";
import { Coffee } from "lucide-react";

interface BeanCardProps {
  bean: CoffeeBean;
}

export default function BeanCard({ bean }: BeanCardProps) {
  return (
    <Link href={`/bean/${bean.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex h-24">
        <div className="w-24 h-24 relative">
          {bean.imageUrl ? (
            <Image 
              src={bean.imageUrl} 
              alt={bean.name} 
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <Coffee className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 p-3">
          <h3 className="font-medium text-gray-900 line-clamp-1">{bean.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-1">by {bean.roaster}</p>
          <div className="mt-1 flex items-center">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(bean.averageRating) ? "text-yellow-400" : "text-gray-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 15.585l-7.07 3.716 1.35-7.87L.36 7.13l7.91-1.15L10 0l1.73 5.98 7.91 1.15-5.92 5.77 1.35 7.87z"
                    clipRule="evenodd"
                  />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-xs text-gray-600">
              {bean.averageRating.toFixed(1)} ({bean.totalRatings})
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {bean.origin} • {bean.roastLevel} Roast
          </p>
        </div>
      </div>
    </Link>
  );
}
