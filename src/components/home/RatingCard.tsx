
import Image from "next/image";
import Link from "next/link";
import { RatingWithDetails } from "@/services/ratingsService";
import { Heart, MessageCircle, Coffee, User, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RatingCardProps {
  rating: RatingWithDetails;
}

export default function RatingCard({ rating }: RatingCardProps) {
  const renderStars = (ratingValue: string) => {
    const numericRating = parseFloat(ratingValue);
    return (
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= numericRating ? "text-amber-400 fill-amber-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="ml-2 text-sm font-medium text-gray-700">
          {numericRating.toFixed(1)}/5
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden mb-4 hover:shadow-lg hover:shadow-neutral-900/5 transition-all duration-300 hover:-translate-y-1">
      {/* User Header */}
      <div className="p-4 border-b border-gray-100/80">
        <div className="flex items-center">
          <Link href={`/profile/${rating.user_id}`} className="flex items-center hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-full overflow-hidden relative ring-2 ring-amber-100">
              {rating.users?.profile_image_url ? (
                <Image 
                  src={rating.users.profile_image_url} 
                  alt={rating.users.username || "User"} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-amber-600" />
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="font-semibold text-gray-900">
                {rating.users?.display_name || rating.users?.username || "Coffee Enthusiast"}
              </p>
              <p className="text-sm text-gray-500">@{rating.users?.username || "unknown"}</p>
            </div>
          </Link>
          <div className="ml-auto text-sm text-gray-400">
            {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Coffee Bean Image */}
      <Link href={`/rating/${rating.id}`}>
        <div className="relative aspect-square bg-gradient-to-br from-amber-50 to-neutral-50 cursor-pointer group">
          {rating.coffee_beans?.image_url ? (
            <Image 
              src={rating.coffee_beans.image_url} 
              alt={rating.coffee_beans.name || "Coffee"} 
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <Coffee className="h-16 w-16 text-amber-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No image available</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      {/* Rating Content */}
      <div className="p-4">
        {/* Rating Stars */}
        <div className="mb-3">
          {renderStars(rating.overall_rating)}
        </div>

        {/* Coffee Bean Info */}
        <Link href={`/bean/${rating.coffee_bean_id}`} className="block mb-2 group">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">
            {rating.coffee_beans?.name || "Unknown Coffee"}
          </h3>
          <p className="text-sm text-gray-600">
            by {rating.coffee_beans?.brand || "Unknown Roaster"}
          </p>
        </Link>

        {/* Brewing Method & Origin */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {rating.brewing_method && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              {rating.brewing_method}
            </span>
          )}
          {rating.coffee_beans?.origin && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
              {rating.coffee_beans.origin}
            </span>
          )}
          {rating.coffee_beans?.roast_level && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
              {rating.coffee_beans.roast_level}
            </span>
          )}
        </div>

        {/* Review Text */}
        {rating.review_text && (
          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed mb-4">
            {rating.review_text}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button className="flex items-center text-gray-500 hover:text-red-500 transition-colors group">
              <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="ml-1 text-sm">0</span>
            </button>
            <button className="flex items-center text-gray-500 hover:text-blue-500 transition-colors group">
              <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="ml-1 text-sm">0</span>
            </button>
          </div>
          <Link 
            href={`/rating/${rating.id}`}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
