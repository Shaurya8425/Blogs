import { Link, useNavigate } from "react-router-dom";
import { Post } from "../../services/blog";
import { useState } from "react";
import { blogService } from "../../services/blog";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "react-hot-toast";

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onUpvote?: (postId: string) => void;
}

export const PostCard = ({ post, onDelete, onUpvote }: PostCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthor = user?.userId === post.author.id;
  const hasUpvoted = post.upvotes.some(
    (upvote) => upvote.userId === user?.userId
  );

  const formatDate = (dateString: string | undefined) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 24) {
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
      return "N/A";
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await blogService.deletePost(post.id);
      onDelete?.(post.id);
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking upvote
    if (!user) return;
    try {
      const hasUpvoted = post.upvotes.some(
        (upvote) => upvote.userId === user.userId
      );
      if (hasUpvoted) {
        await blogService.removeUpvote(post.id);
      } else {
        await blogService.upvotePost(post.id);
      }
      onUpvote?.(post.id);
    } catch (error) {
      console.error("Error handling upvote:", error);
    }
  };

  return (
    <Card className='hover:shadow-lg transition-shadow duration-200'>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center space-x-2'>
          <span className='text-sm text-gray-500'>
            {post.author.name || post.author.email}
          </span>
          <span className='text-gray-300'>•</span>
          <span className='text-sm text-gray-500'>
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
            <div className="flex items-center gap-2">
              <Link to={`/edit/${post.id}`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              {showDeleteConfirm ? (
                <>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <Link to={`/post/${post.id}`} className="block">
        <h2 className='text-xl font-semibold mb-2'>{post.title}</h2>
        {post.imageUrl && (
          <div className="mb-4">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-[300px] object-cover rounded-lg"
            />
          </div>
        )}
        <p className='text-gray-600'>{post.content}</p>
      </Link>
    </Card>
  );
};
