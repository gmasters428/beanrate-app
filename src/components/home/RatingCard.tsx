
import Image from "next/image";
import Link from "next/link";
import { RatingWithDetails } from "@/services/ratingsService";
import { Heart, MessageCircle, Coffee, User, Star, MapPin, Thermometer, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RatingCardProps {
  rating: RatingWithDetails;
}

export default function RatingCard({ rating }: RatingCardProps) {
  const renderStarRating = (ratingValue: number | null | undefined) => {
    const numericRating = ratingValue ?? 0;
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= numericRating ? "text-amber-500 fill-amber-500" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-lg font-bold text-gray-900 ml-1">
          {numericRating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
      {/* User Info Header */}
      <div className="px-4 pt-3 pb-2">
        <Link href={`/profile/${rating.user_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-full overflow-hidden relative ring-1 ring-gray-200 shrink-0">
            {rating.users?.profile_image_url ? (
              <Image 
                src={rating.users.profile_image_url} 
                alt={rating.users.username || "User"} 
                width={32}
                height={32}
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <User className="h-4 w-4 text-amber-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {rating.users?.display_name || rating.users?.username || "Unknown User"}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="px-4 pb-4">
        <div className="flex gap-4">
          {/* Coffee Bean Image */}
          <Link href={`/bean/${rating.coffee_bean_id}`} className="shrink-0">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-neutral-100 ring-1 ring-gray-200 hover:ring-amber-300 transition-all duration-300 hover:scale-[1.02]">
              {rating.coffee_beans?.image_url ? (
                <Image 
                  src={rating.coffee_beans.image_url} 
                  alt={rating.coffee_beans.name || "Coffee"} 
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Coffee className="h-8 w-8 text-amber-400" />
                </div>
              )}
            </div>
          </Link>

          {/* Coffee Details */}
          <div className="flex-1 min-w-0">
            <Link href={`/bean/${rating.coffee_bean_id}`} className="block hover:opacity-80 transition-opacity">
              <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                {rating.coffee_beans?.name || "Unknown Coffee"}
              </h3>
              <p className="text-sm text-gray-600 font-medium mb-2">
                {rating.coffee_beans?.brand || "Unknown Roaster"}
              </p>
            </Link>

            {/* Coffee Metadata */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
              {rating.coffee_beans?.origin && (
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{rating.coffee_beans.origin}</span>
                </div>
              )}
              {rating.coffee_beans?.roast_level && (
                <div className="flex items-center">
                  <Thermometer className="h-3 w-3 mr-1" />
                  <span>{rating.coffee_beans.roast_level}</span>
                </div>
              )}
            </div>

            {/* Rating Display */}
            <div className="mb-3">
              {renderStarRating(rating.overall_rating)}
            </div>

            {/* Coffee Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {rating.coffee_beans?.variety && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  {rating.coffee_beans.variety}
                </span>
              )}
              {rating.brewing_method && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {rating.brewing_method}
                </span>
              )}
              {rating.grinder && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  {rating.grinder}
                </span>
              )}
            </div>

            {/* Review Text */}
            {rating.review_text && (
              <div className="mb-3">
                <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                  {rating.review_text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button className="flex items-center text-gray-400 hover:text-red-500 transition-colors group/heart">
              <div className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                <Heart className="h-4 w-4" />
              </div>
              <span className="ml-1 text-sm">Like</span>
            </button>
            <button className="flex items-center text-gray-400 hover:text-blue-500 transition-colors group/comment">
              <div className="p-2 rounded-lg hover:bg-blue-50 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="ml-1 text-sm">Comment</span>
            </button>
          </div>
          
          <Link 
            href={`/rating/${rating.id}`}
            className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
