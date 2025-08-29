
import Image from "next/image";
import Link from "next/link";
import { RatingWithDetails } from "@/services/ratingsService";
import { Heart, MessageCircle, Coffee, User, Star, MapPin, Thermometer } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RatingCardProps {
  rating: RatingWithDetails;
}

export default function RatingCard({ rating }: RatingCardProps) {
  const renderStarRating = (ratingValue: number | null | undefined) => {
    const numericRating = ratingValue ?? 0;
    return (
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3.5 w-3.5 ${
                star <= numericRating ? "text-amber-400 fill-amber-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="ml-1.5 text-sm font-bold text-gray-900">
          {numericRating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200/70 overflow-hidden hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group">
      <div className="p-4">
        {/* Header Row - Coffee Info & Rating */}
        <div className="flex items-start gap-4 mb-3">
          {/* Coffee Bean Image */}
          <Link href={`/bean/${rating.coffee_bean_id}`} className="shrink-0">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-amber-50 to-neutral-100 ring-1 ring-neutral-200/50 group-hover:ring-amber-200 transition-all duration-300">
              {rating.coffee_beans?.image_url ? (
                <Image 
                  src={rating.coffee_beans.image_url} 
                  alt={rating.coffee_beans.name || "Coffee"} 
                  width={64}
                  height={64}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Coffee className="h-6 w-6 text-amber-400" />
                </div>
              )}
            </div>
          </Link>

          {/* Coffee Details */}
          <div className="flex-1 min-w-0">
            <Link href={`/bean/${rating.coffee_bean_id}`} className="block group/link">
              <h3 className="font-bold text-base text-gray-900 group-hover/link:text-amber-700 transition-colors line-clamp-1 mb-1">
                {rating.coffee_beans?.name || "Unknown Coffee"}
              </h3>
            </Link>
            
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <span className="font-medium">{rating.coffee_beans?.brand || "Unknown Roaster"}</span>
              {rating.coffee_beans?.origin && (
                <>
                  <span className="mx-1.5 text-gray-400">•</span>
                  <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="truncate">{rating.coffee_beans.origin}</span>
                </>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between">
              {renderStarRating(rating.overall_rating)}
              <span className="text-xs text-gray-500 ml-2">
                {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Bean Characteristics */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {rating.coffee_beans?.roast_level && (
            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
              <Thermometer className="h-3 w-3 mr-1" />
              {rating.coffee_beans.roast_level}
            </div>
          )}
          {rating.brewing_method && (
            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {rating.brewing_method}
            </div>
          )}
          {rating.coffee_beans?.variety && (
            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              {rating.coffee_beans.variety}
            </div>
          )}
        </div>

        {/* Review Preview */}
        {rating.review_text && (
          <div className="mb-3">
            <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed">
              {rating.review_text}
            </p>
          </div>
        )}

        {/* User & Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Link href={`/profile/${rating.user_id}`} className="flex items-center hover:opacity-80 transition-opacity">
            <div className="h-6 w-6 rounded-full overflow-hidden relative ring-1 ring-gray-200">
              {rating.users?.profile_image_url ? (
                <Image 
                  src={rating.users.profile_image_url} 
                  alt={rating.users.username || "User"} 
                  width={24}
                  height={24}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <User className="h-3 w-3 text-amber-600" />
                </div>
              )}
            </div>
            <span className="ml-2 text-xs text-gray-600 font-medium">
              @{rating.users?.username || "unknown"}
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <button className="flex items-center text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
              <span className="ml-1 text-xs">0</span>
            </button>
            <button className="flex items-center text-gray-400 hover:text-blue-500 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="ml-1 text-xs">0</span>
            </button>
            <Link 
              href={`/rating/${rating.id}`}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
