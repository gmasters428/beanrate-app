
import Image from "next/image";
import Link from "next/link";
import { Rating } from "@/types";
import { Heart, MessageCircle, Coffee } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RatingCardProps {
  rating: Rating;
}

export default function RatingCard({ rating }: RatingCardProps) {
  const { user, coffeeBean, brewMethod, tags, notes, beanImage, brewedImage, createdAt, likes, comments } = rating;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link href={`/profile/${user.id}`}>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full overflow-hidden relative">
                {user.profileImage ? (
                  <Image 
                    src={user.profileImage} 
                    alt={user.username} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>
          </Link>
          <div className="ml-auto text-sm text-gray-500">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      <Link href={`/rating/${rating.id}`}>
        <div className="relative aspect-square">
          {brewedImage ? (
            <Image 
              src={brewedImage} 
              alt={`${coffeeBean.name} brewed`} 
              fill
              className="object-cover"
            />
          ) : beanImage ? (
            <Image 
              src={beanImage} 
              alt={coffeeBean.name} 
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <Coffee className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-5 w-5 ${
                  star <= rating.rating ? "text-yellow-400" : "text-gray-300"
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
          <span className="ml-2 text-sm font-medium text-gray-700">
            {rating.rating}/5
          </span>
        </div>

        <Link href={`/bean/${coffeeBean.id}`}>
          <h3 className="font-bold text-lg text-gray-900 hover:text-brown-600">
            {coffeeBean.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-700">by {coffeeBean.roaster}</p>

        <div className="mt-2 flex items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brown-100 text-brown-800">
            {brewMethod}
          </span>
          {tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="ml-2 text-xs text-gray-500">
              +{tags.length - 2} more
            </span>
          )}
        </div>

        {notes && (
          <p className="mt-2 text-gray-700 text-sm line-clamp-2">{notes}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center text-gray-500 hover:text-red-500">
              <Heart
                className={`h-5 w-5 ${
                  likes.length > 0 ? "fill-red-500 text-red-500" : ""
                }`}
              />
              {likes.length > 0 && (
                <span className="ml-1 text-sm">{likes.length}</span>
              )}
            </button>
            <button className="flex items-center text-gray-500 hover:text-blue-500">
              <MessageCircle className="h-5 w-5" />
              {comments.length > 0 && (
                <span className="ml-1 text-sm">{comments.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
