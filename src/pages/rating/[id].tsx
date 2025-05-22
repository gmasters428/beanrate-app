
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Layout from "@/components/layout/Layout";
import { mockRatings, mockUsers } from "@/data/mockData";
import { Rating, Comment, User } from "@/types";
import { Heart, MessageCircle, Send, User as UserIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RatingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  
  // In a real app, we would get the current user from auth context
  // For now, we'll just use the first user from our mock data
  const currentUser = mockUsers[0];

  useEffect(() => {
    if (id) {
      // Find the rating with the matching ID
      const foundRating = mockRatings.find((r) => r.id === id);
      setRating(foundRating || null);
      
      if (foundRating) {
        // Check if the current user has liked this rating
        setIsLiked(foundRating.likes.includes(currentUser.id));
      }
      
      setLoading(false);
    }
  }, [id, currentUser.id]);

  const handleLike = () => {
    if (!rating) return;
    
    // Toggle like status
    setIsLiked(!isLiked);
    
    // Update likes array
    if (isLiked) {
      // Remove like
      setRating({
        ...rating,
        likes: rating.likes.filter((userId) => userId !== currentUser.id)
      });
    } else {
      // Add like
      setRating({
        ...rating,
        likes: [...rating.likes, currentUser.id]
      });
    }
  };

  const handleAddComment = () => {
    if (!rating || !commentText.trim()) return;
    
    // Create new comment
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      user: currentUser,
      ratingId: rating.id,
      content: commentText,
      createdAt: new Date().toISOString()
    };
    
    // Add comment to rating
    setRating({
      ...rating,
      comments: [...rating.comments, newComment]
    });
    
    // Clear comment input
    setCommentText("");
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="max-w-md mx-auto text-center py-12">
          <p>Loading rating...</p>
        </div>
      </Layout>
    );
  }

  if (!rating) {
    return (
      <Layout title="Rating Not Found">
        <div className="max-w-md mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rating Not Found</h1>
          <p className="text-gray-600 mb-6">The rating you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700"
          >
            Back to Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${rating.user.name}'s Rating | BeanRate`}>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full overflow-hidden relative">
                {rating.user.profileImage ? (
                  <Image 
                    src={rating.user.profileImage} 
                    alt={rating.user.username} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{rating.user.name}</p>
                <p className="text-sm text-gray-500">@{rating.user.username}</p>
              </div>
              <div className="ml-auto text-sm text-gray-500">
                {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          
          {rating.brewedImage && (
            <div className="relative aspect-square">
              <Image 
                src={rating.brewedImage} 
                alt="Brewed coffee" 
                fill
                className="object-cover"
              />
            </div>
          )}
          
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
            
            <h3 className="font-bold text-lg text-gray-900">
              {rating.coffeeBean.name}
            </h3>
            <p className="text-sm text-gray-700">by {rating.coffeeBean.roaster}</p>
            
            <div className="mt-2 flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brown-100 text-brown-800">
                {rating.brewMethod}
              </span>
              {rating.tags.map((tag, index) => (
                <span
                  key={index}
                  className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            {rating.notes && (
              <p className="mt-3 text-gray-700">{rating.notes}</p>
            )}
            
            {rating.beanImage && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Coffee Beans:</p>
                <div className="relative h-40 rounded-lg overflow-hidden">
                  <Image 
                    src={rating.beanImage} 
                    alt="Coffee beans" 
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center space-x-4">
                <button 
                  className={`flex items-center ${isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500" : ""}`} />
                  {rating.likes.length > 0 && (
                    <span className="ml-1">{rating.likes.length}</span>
                  )}
                </button>
                <button className="flex items-center text-gray-500 hover:text-blue-500">
                  <MessageCircle className="h-6 w-6" />
                  {rating.comments.length > 0 && (
                    <span className="ml-1">{rating.comments.length}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3">Comments</h4>
            
            <div className="space-y-4 mb-4">
              {rating.comments.length > 0 ? (
                rating.comments.map((comment) => (
                  <div key={comment.id} className="flex">
                    <div className="h-8 w-8 rounded-full overflow-hidden relative flex-shrink-0">
                      {comment.user.profileImage ? (
                        <Image 
                          src={comment.user.profileImage} 
                          alt={comment.user.username} 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex-1">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <p className="text-sm font-medium text-gray-900">
                          {comment.user.name}
                        </p>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No comments yet.</p>
              )}
            </div>
            
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full overflow-hidden relative flex-shrink-0">
                {currentUser.profileImage ? (
                  <Image 
                    src={currentUser.profileImage} 
                    alt={currentUser.username} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="ml-2 flex-1 relative">
                <input
                  type="text"
                  className="w-full p-2 pr-10 border border-gray-300 rounded-full text-sm"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddComment();
                    }
                  }}
                />
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-brown-600 hover:text-brown-700 disabled:text-gray-300"
                  disabled={!commentText.trim()}
                  onClick={handleAddComment}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
