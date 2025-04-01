import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { DeleteConfirmation } from "../components/common/DeleteConfirmation";
import { ThumbsUp } from "lucide-react";
import { Card } from "../components/ui/card";

export const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't fetch if auth is still loading
    if (isAuthLoading) return;

    if (!user) {
      setIsLoading(false);
      setPosts([]);
      return;
    }
    
    fetchPosts();

    // Set up more frequent polling for better real-time updates
    const pollInterval = setInterval(fetchPosts, 3000); // Poll every 3 seconds

    // Listen for post creation events
    const handlePostCreated = () => {
      console.log('Post created event received, fetching posts...');
      fetchPosts();
    };

    // Listen for post updates
    const handlePostUpdated = () => {
      console.log('Post updated event received, fetching posts...');
      fetchPosts();
    };

    window.addEventListener('post-created', handlePostCreated);
    window.addEventListener('post-updated', handlePostUpdated);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('post-created', handlePostCreated);
      window.removeEventListener('post-updated', handlePostUpdated);
    };
  }, [user, isAuthLoading]);

  const fetchPosts = async () => {
    try {
      const response = await blogService.getAllPosts();
      // Deep compare posts to prevent unnecessary re-renders
      if (JSON.stringify(response) !== JSON.stringify(posts)) {
        setPosts(response);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const hasUpvoted = post.upvotes.some(upvote => upvote.userId === user.userId);

      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            upvotes: hasUpvoted
              ? p.upvotes.filter(u => u.userId !== user.userId)
              : [...p.upvotes, { 
                  userId: user.userId, 
                  postId, 
                  id: 'temp',
                  createdAt: new Date().toISOString()
                }]
          };
        }
        return p;
      }));

      // Make API call
      if (hasUpvoted) {
        await blogService.removeUpvote(postId);
      } else {
        await blogService.upvotePost(postId);
      }

      // Dispatch update event
      window.dispatchEvent(new CustomEvent('post-updated'));
      
      // Fetch the updated post
      const updatedPost = await blogService.getPostById(postId);
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
    } catch (error) {
      console.error('Error handling upvote:', error);
      // Revert on error by refreshing posts
      fetchPosts();
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    
    setIsDeleting(true);
    try {
      await blogService.deletePost(selectedPost.id);
      setPosts(posts.filter((p) => p.id !== selectedPost.id));
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setSelectedPost(null);
    }
  };

  const PostCard = ({ post, onDelete, onUpvote }: { post: Post, onDelete: () => void, onUpvote: () => void }) => {
    const isAuthor = user?.userId === post.author.id;
    const hasUpvoted = post.upvotes.some(upvote => upvote.userId === user?.userId);

    return (
      <Card 
        className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/post/${post.id}`)}
      >
        <h2 className="text-2xl font-bold mb-4">{post.title}</h2>
        <p className="text-gray-600 mb-4">
          {post.content.substring(0, 200)}...
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              By {post.author?.name || "Unknown"}
            </div>
            <Button
              variant={hasUpvoted ? "secondary" : "outline"}
              size="sm"
              className="flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onUpvote();
              }}
            >
              <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? "fill-current" : ""}`} />
              <span>{post.upvotes.length}</span>
            </Button>
          </div>
          {isAuthor && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/post/${post.id}/edit`);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {isAuthLoading ? null : !user ? (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Medium Blog</h2>
            <p className="text-gray-600 mb-6">Please log in to access the blog posts and interact with the community.</p>
            <Button 
              variant="primary"
              onClick={() => navigate('/login')}
            >
              Log In to Continue
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={() => {
                    setSelectedPost(post);
                    setShowDeleteConfirm(true);
                  }}
                  onUpvote={() => handleUpvote(post.id)}
                />
              ))}
            </div>

            {showDeleteConfirm && (
              <DeleteConfirmation
                onConfirm={handleDelete}
                onCancel={() => {
                  setShowDeleteConfirm(false);
                  setSelectedPost(null);
                }}
                isLoading={isDeleting}
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};
