import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        if (!id) return;
        const data = await blogService.getPostById(id);
        setPost(data);
      } catch (err: any) {
        console.error("Error loading post:", err);
        setError(err.message || "Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id]);

  const handleDelete = async () => {
    if (!post) return;
    try {
      setIsDeleting(true);
      await blogService.deletePost(post.id);
      navigate("/");
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className='flex justify-center items-center min-h-[60vh]'>
          <p className='text-gray-600 animate-pulse'>Loading post...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout>
        <div className='flex flex-col items-center justify-center min-h-[60vh]'>
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4'>
            {error || "Post not found"}
          </div>
          <button className='btn btn-secondary' onClick={() => navigate("/")}>
            Return to Home
          </button>
        </div>
      </MainLayout>
    );
  }

  const isAuthor = user?.userId === post.author.id;

  return (
    <MainLayout>
      <div className='max-w-4xl mx-auto'>
        <div className='card'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-500'>
                {post.author.name || post.author.email}
              </span>
              <span className='text-gray-300'>•</span>
              <span className='text-sm text-gray-500'>
                {new Date(post.createdAt || "").toLocaleDateString()}
              </span>
            </div>
            {isAuthor && (
              <div className='flex items-center space-x-2'>
                <button
                  className='btn btn-secondary'
                  onClick={() => navigate(`/edit/${post.id}`)}
                >
                  Edit
                </button>
                <button
                  className='btn btn-danger'
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>

          <h1 className='text-4xl font-bold text-gray-900 mb-6'>
            {post.title}
          </h1>
          <div className='prose max-w-none'>
            <p className='text-gray-700 whitespace-pre-wrap'>{post.content}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
