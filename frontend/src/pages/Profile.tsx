import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { toast } from "react-hot-toast";

export function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // If no userId is provided in URL, use the logged-in user's ID
        const targetUserId = userId || user?.userId;
        if (!targetUserId) {
          setError("No user found");
          return;
        }

        const userPosts = await blogService.getUserPosts(targetUserId);
        setPosts(userPosts);

        // Get user profile data
        const userData = await blogService.getUserProfile(targetUserId);
        setProfileUser(userData);
        setName(userData.name || "");
      } catch (err: any) {
        console.error("Error loading profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, user?.userId]);

  const formatDate = (dateString: string | undefined) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);

      if (diffInSeconds < 60) {
        return "just now";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validate passwords if changing
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          toast.error("Please fill in all password fields");
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match");
          return;
        }
      }

      // Prepare the update data
      const updateData = {
        name: name.trim(),
        ...(currentPassword && newPassword
          ? { currentPassword, newPassword }
          : {}),
      };

      // Make the API call
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = "Failed to update profile";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorMessage);
      }

      // Parse the successful response
      let updatedProfile;
      try {
        updatedProfile = await response.json();
      } catch (e) {
        console.error("Error parsing success response:", e);
        throw new Error("Invalid response from server");
      }

      // Update the UI
      setProfileUser(updatedProfile);
      setIsEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSubmitting(false);
    }
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

  if (error || !profileUser) {
    return (
      <MainLayout>
        <div className='flex flex-col items-center justify-center min-h-[60vh]'>
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4'>
            {error || "Profile not found"}
          </div>
          <Button variant='secondary' onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isOwnProfile = user?.userId === profileUser.id;

  return (
    <MainLayout>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Profile Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {profileUser.name || profileUser.email}
              </h1>
              <p className='text-gray-600'>{profileUser.email}</p>
            </div>
            {isOwnProfile && (
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            )}
          </div>
        </div>

        {/* User's Posts */}
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Posts ({posts.length})
          </h2>
          {isEditing ? (
            <Card className='p-6 mb-8'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <Label htmlFor='name'>Name</Label>
                  <Input
                    id='name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <h3 className='text-lg font-medium'>Change Password</h3>
                  <div>
                    <Label htmlFor='currentPassword'>Current Password</Label>
                    <Input
                      id='currentPassword'
                      type='password'
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor='newPassword'>New Password</Label>
                    <Input
                      id='newPassword'
                      type='password'
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor='confirmPassword'>
                      Confirm New Password
                    </Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button type='submit' disabled={isSubmitting} variant='primary'>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Card>
          ) : (
            <div>
              <div className='mb-4'>
                <h2 className='text-lg font-medium'>Name</h2>
                <p className='text-gray-600'>{profileUser.name}</p>
              </div>
              <div>
                <h2 className='text-lg font-medium'>Email</h2>
                <p className='text-gray-600'>{profileUser.email}</p>
              </div>
            </div>
          )}
          {posts.map((post) => (
            <Card key={post.id} className='p-6 mb-4'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3
                    className='text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer'
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {post.title}
                  </h3>
                  <p className='text-gray-500 text-sm mt-1'>
                    {formatDate(post.createdAt)}
                  </p>
                </div>
                <div className='flex items-center space-x-4'>
                  <span className='text-gray-600 text-sm'>
                    {post.upvotes.length} upvotes
                  </span>
                  <span className='text-gray-600 text-sm'>
                    {post.replies.length} replies
                  </span>
                </div>
              </div>
              <p className='text-gray-700 mt-2'>{post.content}</p>
            </Card>
          ))}
          {posts.length === 0 && (
            <p className='text-gray-500 text-center py-8'>
              No posts yet. {isOwnProfile ? "Create your first post!" : ""}
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
