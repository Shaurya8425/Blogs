import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Post, blogService } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { DeleteConfirmation } from "../components/common/DeleteConfirmation";
import { ThumbsUp } from "lucide-react";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

    // Validate passwords if changing password
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        toast.error("Current password is required");
        return;
      }
      if (!newPassword) {
        toast.error("New password is required");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (!profileUser?.id) {
        throw new Error("No user profile found");
      }

      const updateData: { name?: string; currentPassword?: string; newPassword?: string } = {};
      if (name !== profileUser.name) {
        updateData.name = name;
      }
      if (currentPassword && newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const updatedProfile = await blogService.updateUserProfile(profileUser.id, updateData);
      
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

  const handleDelete = async () => {
    if (!deletingPost) return;
    
    setIsDeleting(true);
    try {
      await blogService.deletePost(deletingPost.id);
      setPosts(posts.filter((p) => p.id !== deletingPost.id));
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingPost(null);
    }
  };

  const openDeleteConfirm = (post: Post) => {
    setDeletingPost(post);
    setShowDeleteConfirm(true);
  };

  const handleUpvote = async (postId: string) => {
    try {
      const hasUpvoted = posts.find(p => p.id === postId)?.upvotes.some(upvote => upvote.userId === user?.userId);
      
      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            upvotes: hasUpvoted
              ? p.upvotes.filter(u => u.userId !== user?.userId)
              : [...p.upvotes, { 
                  userId: user?.userId || '', 
                  postId, 
                  id: 'temp',
                  createdAt: new Date().toISOString()
                }]
          };
        }
        return p;
      }));

      if (hasUpvoted) {
        await blogService.removeUpvote(postId);
      } else {
        await blogService.upvotePost(postId);
      }

      // Refresh posts to get latest state
      const updatedPosts = await blogService.getUserPosts(userId || user?.userId || '');
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error handling upvote:', error);
      toast.error('Failed to update upvote');
      // Revert on error
      const updatedPosts = await blogService.getUserPosts(userId || user?.userId || '');
      setPosts(updatedPosts);
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
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {/* Profile Header */}
        <div className='bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-xl sm:text-2xl font-bold text-gray-900'>
                {profileUser.name || profileUser.email}
              </h1>
              <p className='text-gray-600 text-sm sm:text-base'>{profileUser.email}</p>
            </div>
            {isOwnProfile && (
              <Button
                variant={isEditing ? 'outline' : 'default'}
                onClick={() => setIsEditing(!isEditing)}
                className='w-full sm:w-auto'
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            )}
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  variant="primary"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Saving changes</span>
                      <span className="animate-spin">⚪</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* User's Posts */}
        <div className='space-y-4 sm:space-y-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Posts ({posts.length})
          </h2>
          <div className='grid gap-4 sm:gap-6'>
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <h3 className="text-2xl font-bold mb-2 hover:text-blue-600">
                  {post.title}
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant={post.upvotes.some(upvote => upvote.userId === user?.userId) ? "secondary" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpvote(post.id);
                    }}
                  >
                    <ThumbsUp className={`w-4 h-4 ${post.upvotes.some(upvote => upvote.userId === user?.userId) ? "fill-current" : ""}`} />
                    <span>{post.upvotes.length}</span>
                  </Button>
                  {user?.userId === post.author.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/post/${post.id}/edit`);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteConfirm(post);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 line-clamp-3 mb-4">{post.content}</p>
                <div className="text-sm text-gray-500">
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'No date'}
                </div>
              </Card>
            ))}
            {posts.length === 0 && (
              <p className='text-gray-500 text-center py-8'>
                No posts yet. {isOwnProfile ? "Create your first post!" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <DeleteConfirmation
            onConfirm={handleDelete}
            onCancel={() => {
              setShowDeleteConfirm(false);
              setDeletingPost(null);
            }}
            isLoading={isDeleting}
          />
        )}
      </div>
    </MainLayout>
  );
}
