import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";

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

  useEffect(() => {
    // Initial fetch
    fetchPosts();

    // Set up polling every 5 seconds
    const pollInterval = setInterval(fetchPosts, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval);
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

  const handleUpvote = async (postId: string) => {
    try {
      const hasUpvoted = posts
        .find((p) => p.id === postId)
        ?.upvotes.some((upvote) => upvote.userId === user?.userId);

      // Optimistically update the UI
      setPosts(
        posts.map((post) => {
          if (post.id === postId) {
            const newUpvotes = hasUpvoted
              ? post.upvotes.filter((upvote) => upvote.userId !== user?.userId)
              : [
                  ...post.upvotes,
                  {
                    id: "temp",
                    createdAt: new Date().toISOString(),
                    userId: user?.userId || "",
                    postId,
                  },
                ];
            return { ...post, upvotes: newUpvotes };
          }
          return post;
        })
      );

      // Make the API call in the background
      if (hasUpvoted) {
        await blogService.removeUpvote(postId);
      } else {
        await blogService.upvotePost(postId);
      }

      // Fetch the updated post to ensure consistency
      const updatedPost = await blogService.getPostById(postId);
      setPosts(posts.map((post) => (post.id === postId ? updatedPost : post)));
    } catch (error) {
      console.error("Error updating upvote:", error);
      // Revert the optimistic update on error
      const updatedPost = await blogService.getPostById(postId);
      setPosts(posts.map((post) => (post.id === postId ? updatedPost : post)));
    }
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
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Blog Posts</h1>
          <Button variant='primary' onClick={() => navigate("/create")}>
            Create New Post
          </Button>
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
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4'>
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
                      variant={
                        post.upvotes.some(
                          (upvote) => upvote.userId === user?.userId
                        )
                          ? "primary"
                          : "secondary"
                      }
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleUpvote(post.id);
                      }}
                      disabled={!user}
                    >
                      {post.upvotes.some(
                        (upvote) => upvote.userId === user?.userId
                      )
                        ? "Upvoted"
                        : "Upvote"}{" "}
                      ({post.upvotes.length})
                    </Button>
                    {isAuthor && (
                      <div className='flex items-center gap-2'>
                        {!showDeleteConfirm ? (
                          <>
                            <Button
                              variant='secondary'
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                navigate(`/edit/${post.id}`);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant='danger'
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(post.id);
                              }}
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='danger'
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDelete(post.id);
                              }}
                              isLoading={isDeleting}
                            >
                              {isDeleting ? "..." : "Confirm"}
                            </Button>
                            <Button
                              variant='secondary'
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <h2 className='text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600'>
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
