import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { toast } from "react-hot-toast";
import { Pencil } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export const EditPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;

  useEffect(() => {
    const loadPost = async () => {
      try {
        const post = await blogService.getPostById(postId!);
        if (post.author.id !== user?.userId) {
          toast.error("You don't have permission to edit this post");
          navigate('/');
          return;
        }
        setTitle(post.title);
        setContent(post.content);
      } catch (error) {
        console.error("Error loading post:", error);
        toast.error("Failed to load post");
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [postId, user?.userId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await blogService.updatePost(postId!, {
        title: title.trim(),
        content: content.trim(),
      });
      toast.success('Post updated successfully!');
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error('Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-3xl mx-auto p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto p-6">
          <div className="flex items-center gap-2 mb-6">
            <Pencil className="w-5 h-5" />
            <h1 className="text-2xl font-bold">Edit Post</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your post title"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium text-gray-700">
                Content
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
                className="w-full min-h-[300px]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Saving</span>
                    <span className="animate-spin">⚪</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EditPost;
