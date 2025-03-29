import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";

export const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await blogService.getAllPosts();
        setPosts(data);
      } catch (err: any) {
        console.error("Error fetching posts:", err);
        setError(err.message || "Failed to fetch posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    try {
      setIsDeleting(true);
      await blogService.deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
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

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className='flex justify-center items-center min-h-[60vh]'>
          <p className='text-gray-600 animate-pulse'>Loading posts...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className='flex flex-col items-center justify-center min-h-[60vh]'>
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4'>
            {error}
          </div>
          <button
            className='btn btn-secondary'
            onClick={() => {
              const fetchPosts = async () => {
                try {
                  const data = await blogService.getAllPosts();
                  setPosts(data);
                } catch (err: any) {
                  console.error("Error loading posts:", err);
                  setError(err.message || "Failed to load posts");
                }
              };
              fetchPosts();
            }}
          >
            Try Again
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='max-w-4xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Blog Posts</h1>
          <button
            className='btn btn-primary'
            onClick={() => navigate("/create")}
          >
            Create New Post
          </button>
        </div>

        <div className='space-y-6'>
          {posts.map((post) => {
            const isAuthor = user?.userId === post.author.id;
            return (
              <div
                key={post.id}
                className='card cursor-pointer hover:shadow-md transition-shadow duration-200'
                onClick={() => handlePostClick(post.id)}
              >
                <div className='flex items-center justify-between mb-4'>
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
                    <div
                      className='flex items-center space-x-2'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className='btn btn-secondary'
                        onClick={() => navigate(`/edit/${post.id}`)}
                      >
                        Edit
                      </button>
                      {showDeleteConfirm !== post.id ? (
                        <button
                          className='btn btn-danger'
                          onClick={() => setShowDeleteConfirm(post.id)}
                        >
                          Delete
                        </button>
                      ) : (
                        <>
                          <button
                            className='btn btn-danger'
                            onClick={() => handleDelete(post.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Confirm"}
                          </button>
                          <button
                            className='btn btn-secondary'
                            onClick={() => setShowDeleteConfirm(null)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                  {post.title}
                </h2>
                <p className='text-gray-600 line-clamp-3'>{post.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};
