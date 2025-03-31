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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const fetchPosts = async () => {
    try {
      const response = await blogService.getAllPosts();
      setPosts(response);
      setTotalPages(Math.ceil(response.length / 10));
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

      // Refresh the post to get the latest state
      const updatedPost = await blogService.getPostById(postId);
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
    } catch (error) {
      console.error('Error handling upvote:', error);
      // Revert on error by refreshing the post
      const updatedPost = await blogService.getPostById(postId);
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
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

  const openDeleteConfirm = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    setSelectedPost(post);
    setShowDeleteConfirm(true);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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
        <div className="grid gap-6">
          {posts.map((post) => {
            const isAuthor = user?.userId === post.author.id;
            const hasUpvoted = post.upvotes.some(upvote => upvote.userId === user?.userId);
            
            return (
              <Card 
                key={post.id}
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
                        handleUpvote(post.id);
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
                          openDeleteConfirm(e, post);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="mx-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
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
      </div>
    </MainLayout>
  );
};
