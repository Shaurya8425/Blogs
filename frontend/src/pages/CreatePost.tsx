import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { toast } from "react-hot-toast";
import { ImagePlus, Pencil } from "lucide-react";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
        console.log('Adding image to form data:', {
          name: image.name,
          type: image.type,
          size: image.size,
          lastModified: image.lastModified
        });
        formData.append('image', image);
      }

      console.log('Submitting post...');
      const post = await blogService.createPost(formData);
      console.log('Post created successfully:', post);
      toast.success('Post created successfully!');
      navigate('/');
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create post');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className='container mx-auto px-4 py-8'>
        <Card className='max-w-3xl mx-auto p-6'>
          <div className='flex items-center gap-2 mb-6'>
            <Pencil className='w-5 h-5' />
            <h1 className='text-2xl font-bold'>Create New Post</h1>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <label
                htmlFor='title'
                className='text-sm font-medium text-gray-700'
              >
                Title
              </label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Enter your post title'
                className='w-full'
                required
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='content'
                className='text-sm font-medium text-gray-700'
              >
                Content
              </label>
              <Textarea
                id='content'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='Write your post content here...'
                className='w-full min-h-[300px]'
                required
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='image'
                className='text-sm font-medium text-gray-700'
              >
                Cover Image (optional)
              </label>
              <div className='mt-1 flex items-center gap-4'>
                <label
                  htmlFor='image-upload'
                  className='cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
                >
                  <ImagePlus className='w-5 h-5' />
                  <span>Choose Image</span>
                </label>
                <input
                  id='image-upload'
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='hidden'
                />
              </div>
              {imagePreview && (
                <div className='mt-4'>
                  <img
                    src={imagePreview}
                    alt='Preview'
                    className='max-w-full h-auto rounded-lg max-h-[300px] object-cover'
                  />
                  <button
                    type='button'
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className='mt-2 text-sm text-red-600 hover:text-red-800'
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>

            <div className='flex items-center justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className='min-w-[100px] border'
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Creating</span>
                    <LoadingSpinner size="small" />
                  </>
                ) : (
                  "Create Post"
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
