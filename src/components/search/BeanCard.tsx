
import Image from "next/image";
import Link from "next/link";
import { CoffeeBeanWithRatings } from "@/types";
import { Coffee, Star } from "lucide-react";

interface BeanCardProps {
  bean: CoffeeBeanWithRatings;
}

export default function BeanCard({ bean }: BeanCardProps) {
  const rating = bean.avg_rating ? Number(bean.avg_rating) : 0;
  const ratingCount = bean.rating_count || 0;

  return (
    <Link href={`/bean/${bean.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex h-28 hover:shadow-lg transition-shadow duration-200">
        <div className="w-28 h-28 relative flex-shrink-0">
          {bean.image_url ? (
            <Image 
              src={bean.image_url} 
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
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{bean.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-1">by {bean.brand}</p>
          </div>
          <div>
            <div className="mt-1 flex items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-1 text-xs text-gray-600">
                {rating > 0 ? `${rating.toFixed(1)} (${ratingCount})` : "No ratings"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {bean.origin} {bean.roast_level && `• ${bean.roast_level} Roast`}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
