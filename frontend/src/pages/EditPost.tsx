import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { blogService } from "../services/blog";
import { useAuth } from "../hooks/useAuth";
import { MainLayout } from "../components/layout/MainLayout";

export const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    const loadPost = async () => {
      try {
        if (!id) return;
        const post = await blogService.getPostById(id);

        if (post.author.id !== user?.userId) {
          setError("You are not authorized to edit this post");
          return;
        }

        setFormData({
          title: post.title,
          content: post.content,
        });
      } catch (error) {
        console.error("Error loading post:", error);
        setError("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id, user?.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setIsSaving(true);
      await blogService.updatePost(id, formData);
      navigate("/");
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className='flex justify-center items-center min-h-[60vh]'>
          <p className='text-gray-600 animate-pulse'>Loading your post...</p>
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
          <button className='btn btn-secondary' onClick={() => navigate("/")}>
            Return to Home
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='max-w-4xl mx-auto'>
        <div className='card'>
          <h1 className='text-3xl font-bold text-gray-900 mb-6'>Edit Post</h1>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label
                htmlFor='title'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Title
              </label>
              <input
                type='text'
                id='title'
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className='input'
                required
              />
            </div>

            <div>
              <label
                htmlFor='content'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Content
              </label>
              <textarea
                id='content'
                rows={12}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className='input'
                required
              />
            </div>

            <div className='flex justify-end space-x-4'>
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => navigate(`/`)}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};
