import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "react-hot-toast";
import { blogService } from "../services/blog";

export const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user?.userId) return;
        const profile = await blogService.getUserProfile(user.userId);
        setName(profile.name || "");
      } catch (err: any) {
        console.error("Error loading profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) return;

    try {
      setIsSaving(true);
      setError(null);
      await blogService.updateUserProfile(user.userId, { name });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className='flex justify-center items-center min-h-[60vh]'>
          <p className='text-gray-600 animate-pulse'>Loading profile...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>
            Edit Profile
          </h1>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Your name'
                disabled={isSaving}
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='secondary'
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='primary'
                isLoading={isSaving}
                disabled={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};
