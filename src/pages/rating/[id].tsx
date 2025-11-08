import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { commentsService, CommentWithUser } from "@/services/commentsService";
import { likesService } from "@/services/likesService";
import { Coffee, User as UserIcon, Star, Heart, MessageCircle, Send, Trash2 } from "lucide-react";

export default function RatingPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();

  const [rating, setRating] = useState<RatingWithDetails | null>(null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRatingData = useCallback(async (ratingId: string) => {
    try {
      setLoading(true);
      const [ratingData, commentsData, likesData] = await Promise.all([
        ratingsService.getRatingById(ratingId),
        commentsService.getCommentsByRating(ratingId),
        likesService.getLikesByRating(ratingId),
      ]);
      
      setRating(ratingData);
      setComments(commentsData);
      setLikeCount(likesData.count);

      if (user && ratingData) {
        const userHasLiked = await likesService.hasUserLikedRating(ratingData.id, user.id);
        setHasLiked(userHasLiked);
      }

    } catch (error) {
      console.error("Failed to fetch rating data:", error);
      toast({ title: "Error", description: "Could not load the rating.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (typeof id === 'string') {
      fetchRatingData(id);
    }
  }, [id, fetchRatingData]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rating || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const createdComment = await commentsService.createComment({
        rating_id: rating.id,
        user_id: user.id,
        text: newComment,
      });
      setComments(prev => [...prev, createdComment]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast({ title: "Error", description: "Could not post your comment.", variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: "Success", description: "Comment deleted." });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast({ title: "Error", description: "Could not delete the comment.", variant: "destructive" });
    }
  };

  const handleLikeToggle = async () => {
    if (!user || !rating || isLiking) return;

    setIsLiking(true);
    try {
      if (hasLiked) {
        await likesService.unlikeRating(rating.id, user.id);
        setLikeCount(prev => prev - 1);
        setHasLiked(false);
      } else {
        await likesService.likeRating(rating.id, user.id);
        setLikeCount(prev => prev + 1);
        setHasLiked(true);
      }
    } catch (error) {
      console.error("Failed to update like status:", error);
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsLiking(false);
    }
  };

  const renderDetailStars = (ratingValue: number) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < Math.round(ratingValue) ? "text-amber-400 fill-amber-400" : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-lg font-bold text-gray-700">{ratingValue.toFixed(1)}</span>
    </div>
  );

  const DetailRating = ({ label, value }: { label: string; value?: number | null }) => {
    if (value === null || typeof value === 'undefined') return null;
    const percentage = (value / 5) * 100;
    return (
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-sm font-bold text-gray-800">{value.toFixed(1)}</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (!rating) return <div className="text-center p-10">Rating not found.</div>;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Image & Bean Info */}
        <div>
          <div className="relative aspect-square w-full rounded-xl shadow-lg overflow-hidden border mb-6">
            {rating.coffee_beans?.image_url ? (
              <Image src={rating.coffee_beans.image_url} alt={rating.coffee_beans.name || ""} fill className="object-cover" />
            ) : (
              <div className="bg-gray-100 h-full w-full flex items-center justify-center">
                <Coffee className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </div>
          
          <Link href={`/bean/${rating.coffee_bean_id}`} className="group">
            <h2 className="text-2xl font-bold text-gray-900 group-hover:text-amber-700">{rating.coffee_beans?.name}</h2>
            <p className="text-lg text-gray-600">by {rating.coffee_beans?.brand}</p>
          </Link>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {rating.brewing_method && <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full">{rating.brewing_method}</span>}
            {rating.coffee_beans?.origin && <span className="text-xs font-medium bg-neutral-100 text-neutral-800 px-2 py-1 rounded-full">{rating.coffee_beans.origin}</span>}
            {rating.coffee_beans?.roast_level && <span className="text-xs font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{rating.coffee_beans.roast_level}</span>}
          </div>
        </div>

        {/* Right Column: Rating Details */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Link href={`/profile/${rating.user_id}`} className="flex items-center group">
              <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-amber-100">
                {rating.users?.profile_image_url ? (
                  <Image src={rating.users.profile_image_url} alt={rating.users.username || ""} fill className="object-cover" />
                ) : (
                  <div className="bg-gray-100 h-full w-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="font-bold text-gray-900 group-hover:text-amber-700">{rating.users?.display_name || rating.users?.username}</p>
                <p className="text-sm text-gray-500">{formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}</p>
              </div>
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="mb-4">{renderDetailStars(rating.overall_rating)}</div>
            <Separator className="my-4"/>
            <div className="space-y-3">
              <DetailRating label="Aroma" value={rating.aroma_rating} />
              <DetailRating label="Flavor" value={rating.flavor_rating} />
              <DetailRating label="Aftertaste" value={rating.aftertaste_rating} />
              <DetailRating label="Acidity" value={rating.acidity_rating} />
              <DetailRating label="Body" value={rating.body_rating} />
            </div>
          </div>

          {rating.review_text && (
            <div className="mt-6">
              <h3 className="font-bold text-lg mb-2">Review</h3>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">{rating.review_text}</p>
            </div>
          )}
        </div>
      </div>
      
      <Separator className="my-8" />

      {/* Actions and Comments */}
      <div>
        <div className="flex items-center space-x-6 mb-6">
          <button onClick={handleLikeToggle} disabled={!user || isLiking} className={`flex items-center space-x-2 text-gray-600 hover:text-red-500 disabled:opacity-50 transition-colors ${hasLiked ? 'text-red-500' : ''}`}>
            <Heart className={`w-6 h-6 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="font-semibold">{likeCount}</span>
          </button>
          <div className="flex items-center space-x-2 text-gray-600">
            <MessageCircle className="w-6 h-6" />
            <span className="font-semibold">{comments.length}</span>
          </div>
        </div>

        <h3 className="font-bold text-xl mb-4">Comments</h3>
        {user ? (
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3 mb-6">
            <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-grow" />
            <Button type="submit" disabled={isSubmittingComment}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <p className="text-gray-500 mb-6">You must be logged in to comment.</p>
        )}

        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border">
                {comment.users?.profile_image_url ? (
                  <Image src={comment.users.profile_image_url} alt={comment.users.username || ""} fill className="object-cover" />
                ) : (
                  <div className="bg-gray-100 h-full w-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-baseline justify-between">
                    <Link href={`/profile/${comment.user_id}`} className="font-bold text-sm hover:underline">{comment.users?.display_name || comment.users?.username}</Link>
                    {user?.id === comment.user_id && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3 h-3"/>
                      </button>
                    )}
                  </div>
                  <p className="text-gray-800">{comment.text}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-gray-500">No comments yet.</p>}
        </div>
      </div>
    </div>
  );
}
