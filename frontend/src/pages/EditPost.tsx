import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { toast } from "react-hot-toast";
import { ImagePlus, Pencil } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export const EditPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
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
        if (post.imageUrl) {
          setCurrentImageUrl(post.imageUrl);
        }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setCurrentImageUrl(null); // Clear the current image URL when a new image is selected
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      if (image) {
        formData.append('image', image);
      }

      await blogService.updatePost(postId!, formData);
      toast.success('Post updated successfully!');
      navigate(`/post/${postId}`);
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

            <div className="space-y-2">
              <label htmlFor="image" className="text-sm font-medium text-gray-700">
                Cover Image (optional)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span>{currentImageUrl ? 'Change Image' : 'Choose Image'}</span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              {(imagePreview || currentImageUrl) && (
                <div className="mt-4">
                  <img
                    src={imagePreview || currentImageUrl || ''}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg max-h-[300px] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                      setCurrentImageUrl(null);
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove image
                  </button>
                </div>
              )}
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
                className="min-w-[100px] border"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Saving</span>
                    <LoadingSpinner size="small"/>
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
