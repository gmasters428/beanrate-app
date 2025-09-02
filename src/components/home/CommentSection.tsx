
import { useState, useEffect } from "react";
import { MessageCircle, Send, Reply, User, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import commentsService, { CommentWithUser } from "@/services/commentsService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

interface CommentSectionProps {
  ratingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentSection({ ratingId, isOpen, onClose }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, ratingId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentsService.getCommentsByRating(ratingId);
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setSubmitting(true);
      const comment = await commentsService.createComment({
        user_id: user.id,
        rating_id: ratingId,
        text: newComment.trim(),
        parent_id: null
      });
      
      setComments([...comments, comment]);
      setNewComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyText.trim()) return;

    try {
      setSubmitting(true);
      const reply = await commentsService.createComment({
        user_id: user.id,
        rating_id: ratingId,
        text: replyText.trim(),
        parent_id: parentId
      });

      // Add reply to the parent comment
      setComments(comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
            reply_count: (comment.reply_count || 0) + 1
          };
        }
        return comment;
      }));
      
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    try {
      await commentsService.deleteComment(commentId);
      
      if (isReply && parentId) {
        // Remove reply from parent comment
        setComments(comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies?.filter(reply => reply.id !== commentId) || [],
              reply_count: Math.max((comment.reply_count || 1) - 1, 0)
            };
          }
          return comment;
        }));
      } else {
        // Remove top-level comment
        setComments(comments.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Comments</h3>
            <span className="text-sm text-gray-500">({comments.reduce((acc, comment) => acc + 1 + (comment.reply_count || 0), 0)})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading comments...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mb-2 text-gray-300" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main Comment */}
                <div className="flex gap-3">
                  <Link href={`/profile/${comment.user_id}`} className="shrink-0">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                      {comment.users?.profile_image_url ? (
                        <Image
                          src={comment.users.profile_image_url}
                          alt={comment.users.username}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/profile/${comment.user_id}`} className="font-semibold text-sm text-gray-900 hover:underline">
                          {comment.users?.display_name || comment.users?.username}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-gray-500 hover:text-blue-500 flex items-center gap-1"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </button>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-500 hover:text-red-500 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 flex gap-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 min-h-[80px] resize-none"
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyText.trim() || submitting}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-100">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Link href={`/profile/${reply.user_id}`} className="shrink-0">
                              <div className="h-6 w-6 rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-green-200">
                                {reply.users?.profile_image_url ? (
                                  <Image
                                    src={reply.users.profile_image_url}
                                    alt={reply.users.username}
                                    width={24}
                                    height={24}
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <User className="h-3 w-3 text-green-600" />
                                  </div>
                                )}
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className="bg-white rounded-2xl p-3 border border-gray-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <Link href={`/profile/${reply.user_id}`} className="font-semibold text-sm text-gray-900 hover:underline">
                                    {reply.users?.display_name || reply.users?.username}
                                  </Link>
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{reply.text}</p>
                              </div>
                              {user?.id === reply.user_id && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id, true, comment.id)}
                                  className="text-xs text-gray-500 hover:text-red-500 mt-1 flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Comment Input */}
        {user ? (
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 shrink-0">
                {user.user_metadata?.profile_image_url ? (
                  <Image
                    src={user.user_metadata.profile_image_url}
                    alt={user.user_metadata?.username || "You"}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 min-h-[80px] resize-none"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 p-4 text-center">
            <p className="text-gray-500 mb-2">Please sign in to comment</p>
            <Link href="/auth/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
