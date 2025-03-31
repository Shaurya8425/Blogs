import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";
import { TextArea } from "../components/common/TextArea";
import { ErrorMessage } from "../components/common/ErrorMessage";

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const formatDate = (dateString: string | undefined) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);

      if (diffInSeconds < 60) {
        return "just now";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  useEffect(() => {
    const loadPost = async () => {
      try {
        if (!id) return;
        const data = await blogService.getPostById(id);
        setPost(data);
      } catch (err: any) {
        console.error("Error loading post:", err);
        setError(err.message || "Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();

    const pollInterval = setInterval(loadPost, 5000);

    return () => clearInterval(pollInterval);
  }, [id]);

  const handleDelete = async () => {
    if (!post) return;
    try {
      setIsDeleting(true);
      await blogService.deletePost(post.id);
      navigate("/");
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpvote = async () => {
    if (!post || !user) return;
    try {
      const hasUpvoted = post.upvotes.some(
        (upvote) => upvote.userId === user.userId
      );
      if (hasUpvoted) {
        await blogService.removeUpvote(post.id);
      } else {
        await blogService.upvotePost(post.id);
      }
      // Reload post to get updated upvotes
      const updatedPost = await blogService.getPostById(post.id);
      setPost(updatedPost);
    } catch (error) {
      console.error("Error handling upvote:", error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !user || !replyContent.trim()) return;

    try {
      setIsSubmittingReply(true);
      setReplyError(null);
      const newReply = await blogService.addReply(post.id, {
        content: replyContent,
      });
      setPost((prev) =>
        prev ? { ...prev, replies: [...prev.replies, newReply] } : null
      );
      setReplyContent("");
    } catch (err: any) {
      setReplyError(err.message || "Failed to add reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!post) return;
    try {
      await blogService.deleteReply(post.id, replyId);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              replies: prev.replies.filter((reply) => reply.id !== replyId),
            }
          : null
      );
    } catch (error) {
      console.error("Error deleting reply:", error);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className='flex justify-center items-center min-h-[60vh]'>
          <p className='text-gray-600 animate-pulse'>Loading post...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout>
        <div className='flex flex-col items-center justify-center min-h-[60vh]'>
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4'>
            {error || "Post not found"}
          </div>
          <button className='btn btn-secondary' onClick={() => navigate("/")}>
            Return to Home
          </button>
        </div>
      </MainLayout>
    );
  }

  const isAuthor = user?.userId === post.author.id;
  const hasUpvoted = post.upvotes.some(
    (upvote) => upvote.userId === user?.userId
  );

  return (
    <MainLayout>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='card'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-500 truncate max-w-[200px]'>
                {post.author.name || post.author.email}
              </span>
              <span className='text-gray-300'>•</span>
              <span className='text-sm text-gray-500 whitespace-nowrap'>
                {formatDate(post.createdAt)}
              </span>
            </div>
            <div className='flex items-center gap-4'>
              <Button
                variant={hasUpvoted ? "primary" : "secondary"}
                onClick={handleUpvote}
                disabled={!user}
              >
                {hasUpvoted ? "Upvoted" : "Upvote"} ({post.upvotes.length})
              </Button>
              {isAuthor && (
                <div className='flex items-center gap-2'>
                  {!showDeleteConfirm ? (
                    <>
                      <Button
                        variant='secondary'
                        onClick={() => navigate(`/edit/${post.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant='danger'
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='danger'
                        onClick={handleDelete}
                        isLoading={isDeleting}
                      >
                        {isDeleting ? "..." : "Confirm"}
                      </Button>
                      <Button
                        variant='secondary'
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <h1 className='text-3xl font-bold mb-4'>{post.title}</h1>
          <div className='prose max-w-none mb-8'>{post.content}</div>

          {/* Replies Section */}
          <div className='mt-8 border-t pt-6'>
            <h2 className='text-xl font-semibold mb-4'>Replies</h2>

            {/* Reply Form */}
            {user && (
              <form onSubmit={handleReply} className='mb-6'>
                <TextArea
                  label='Add a reply'
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder='Write your reply...'
                  disabled={isSubmittingReply}
                  className='mb-2'
                />
                {replyError && (
                  <ErrorMessage message={replyError} className='mb-2' />
                )}
                <Button
                  type='submit'
                  variant='primary'
                  isLoading={isSubmittingReply}
                  disabled={!replyContent.trim()}
                >
                  {isSubmittingReply ? "Posting..." : "Post Reply"}
                </Button>
              </form>
            )}

            {/* Replies List */}
            <div className='space-y-4'>
              {[...post.replies]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((reply) => (
                  <div
                    key={reply.id}
                    className='bg-gray-50 rounded-lg p-4 border border-gray-100'
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex items-center space-x-2'>
                        <span className='font-medium'>
                          {reply.user.name || reply.user.email}
                        </span>
                        <span className='text-sm text-gray-500'>
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      {(user?.userId === reply.user.id ||
                        user?.userId === post.author.id) && (
                        <Button
                          variant='danger'
                          onClick={() => handleDeleteReply(reply.id)}
                          className='text-sm py-1'
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    <p className='text-gray-700'>{reply.content}</p>
                  </div>
                ))}
              {post.replies.length === 0 && (
                <p className='text-gray-500 text-center py-4'>
                  No replies yet. Be the first to reply!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
