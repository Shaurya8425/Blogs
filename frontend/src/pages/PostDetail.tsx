import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { ThumbsUp, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    fetchPost();
  }, [postId, user]);

  const fetchPost = async () => {
    try {
      if (!postId) return;
      const data = await blogService.getPostById(postId);
      setPost(data);
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!post || !user) return;

    try {
      const hasUpvoted = post.upvotes.some(upvote => upvote.userId === user.userId);

      // Optimistic update
      setPost({
        ...post,
        upvotes: hasUpvoted
          ? post.upvotes.filter(u => u.userId !== user.userId)
          : [...post.upvotes, { 
              userId: user.userId, 
              postId: post.id, 
              id: 'temp',
              createdAt: new Date().toISOString()
            }]
      });

      // Make API call
      if (hasUpvoted) {
        await blogService.removeUpvote(post.id);
      } else {
        await blogService.upvotePost(post.id);
      }

      // Refresh post to get latest state
      const updatedPost = await blogService.getPostById(post.id);
      setPost(updatedPost);
    } catch (error) {
      console.error('Error handling upvote:', error);
      toast.error('Failed to update upvote');
      // Revert on error
      const updatedPost = await blogService.getPostById(post.id);
      setPost(updatedPost);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const reply = await blogService.addReply(post.id, {
        content: replyContent
      });
      setPost({
        ...post,
        replies: [...post.replies, reply]
      });
      setReplyContent("");
      toast.success('Reply posted successfully');
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!post) return;
    
    try {
      await blogService.deleteReply(post.id, replyId);
      setPost({
        ...post,
        replies: post.replies.filter(r => r.id !== replyId)
      });
      toast.success('Reply deleted successfully');
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error('Failed to delete reply');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {!user ? (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
            <p className="text-gray-600 mb-6">Please log in to view this post and interact with the community.</p>
            <Button 
              variant="primary"
              onClick={() => navigate('/login')}
            >
              Log In to Continue
            </Button>
          </Card>
        ) : (
          <>
            {isLoading || !post ? (
              <p>Loading...</p>
            ) : (
              <Card className="p-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>By {post.author.name || "Unknown"}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No date'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant={post.upvotes.some(upvote => upvote.userId === user.userId) ? "secondary" : "outline"}
                      size="sm"
                      className="flex items-center gap-1 w-full sm:w-auto justify-center"
                      onClick={handleUpvote}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.upvotes.some(upvote => upvote.userId === user.userId) ? "fill-current" : ""}`} />
                      <span>{post.upvotes.length}</span>
                    </Button>
                    {user.userId === post.author.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto justify-center"
                        onClick={() => navigate(`/post/${post.id}/edit`)}
                      >
                        Edit Post
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="prose max-w-none mb-8 break-words">
                  {post.content}
                </div>

                {/* Reply Section */}
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Replies ({post.replies.length})
                  </h2>
                  
                  <form onSubmit={handleReply} className="mb-6">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className="mb-4 w-full"
                      rows={3}
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting || !replyContent.trim()}
                      className="flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="mr-2">Posting</span>
                          <span className="animate-spin">⚪</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          Post Reply
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="space-y-4">
                    {post.replies.map((reply) => (
                      <Card key={reply.id} className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                          <div className="w-full sm:w-auto">
                            <span className="font-medium block sm:inline">{reply.user?.name || reply.user?.email}</span>
                            <span className="text-gray-500 text-sm block sm:inline sm:ml-2">
                              {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'No date'}
                            </span>
                          </div>
                          {user.userId === reply.user?.id && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto justify-center"
                              onClick={() => handleDeleteReply(reply.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                        <p className="text-gray-700 break-words">{reply.content}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default PostDetail;
