import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      console.error("Error formatting date:", error);
      return "N/A";
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
            {isAuthor && (
              <div className='flex flex-wrap items-center gap-2'>
                {!showDeleteConfirm ? (
                  <>
                    <button
                      className='btn-sm btn-secondary flex-shrink-0 min-w-[60px] text-center'
                      onClick={() => navigate(`/edit/${post.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className='btn-sm btn-danger flex-shrink-0 min-w-[60px] text-center'
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <div className='flex items-center gap-2 w-full sm:w-auto'>
                    <button
                      className='btn-sm btn-danger flex-1 sm:flex-initial text-center min-w-[80px]'
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "..." : "Confirm"}
                    </button>
                    <button
                      className='btn-sm btn-secondary flex-1 sm:flex-initial text-center min-w-[80px]'
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <h1 className='text-4xl font-bold text-gray-900 mb-6'>
            {post.title}
          </h1>
          <div className='prose max-w-none'>
            <p className='text-gray-700 whitespace-pre-wrap'>{post.content}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
