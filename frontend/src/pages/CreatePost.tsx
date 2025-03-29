import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { blogService, CreatePostData } from "../services/blog";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { TextArea } from "../components/common/TextArea";
import { Button } from "../components/common/Button";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { MainLayout } from "../components/layout/MainLayout";

export const CreatePost = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePostData>({
    title: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await blogService.createPost(formData);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className='max-w-3xl mx-auto'>
        <Card>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>
            Write a new story
          </h1>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <Input
              label='Title'
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              placeholder='Enter your story title'
            />

            <TextArea
              label='Content'
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              required
              placeholder='Write your story here...'
              rows={15}
            />

            {error && <ErrorMessage message={error} />}

            <div className='flex justify-end space-x-3'>
              <Button
                variant='secondary'
                onClick={() => navigate("/")}
                type='button'
              >
                Cancel
              </Button>
              <Button type='submit' isLoading={isLoading}>
                {isLoading ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};
