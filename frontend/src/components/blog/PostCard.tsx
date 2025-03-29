import { Link, useNavigate } from "react-router-dom";
import { Post } from "../../services/blog";
import { useState } from "react";
import { blogService } from "../../services/blog";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../common/Card";
import { Button } from "../common/Button";

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

export const PostCard = ({ post, onDelete }: PostCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthor = user?.userId === post.author.id;

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
    } catch (error) {
      // Silently handle delete errors
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
        {isAuthor && (
          <div className='flex items-center space-x-2'>
            <Button
              variant='secondary'
              onClick={() => navigate(`/edit/${post.id}`)}
            >
              Edit
            </Button>
            {!showDeleteConfirm ? (
              <Button
                variant='danger'
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            ) : (
              <>
                <Button
                  variant='danger'
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Confirm
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      <Link to={`/post/${post.id}`}>
        <h2 className='text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600'>
          {post.title}
        </h2>
        <p className='text-gray-600 line-clamp-3'>{post.content}</p>
      </Link>
    </Card>
  );
};
