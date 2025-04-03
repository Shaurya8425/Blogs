import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { toast } from "react-hot-toast";
import { Pencil } from "lucide-react";

export const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const post = await blogService.createPost({
        title: title.trim(),
        content: content.trim(),
      });
      toast.success('Post created successfully!');
      navigate('/');
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto p-6">
          <div className="flex items-center gap-2 mb-6">
            <Pencil className="w-5 h-5" />
            <h1 className="text-2xl font-bold">Create New Post</h1>
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
                onClick={() => navigate(-1)} // Go back to the previous page
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
                    <span className="mr-2">Creating</span>
                    <span className="animate-spin">⚪</span>
                  </>
                ) : (
                  'Create Post'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CreatePost;
