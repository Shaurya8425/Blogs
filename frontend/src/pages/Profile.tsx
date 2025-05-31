import { useState, useCallback, useEffect, useMemo } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
}

interface UpdateProfileData {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate if this is the user's own profile
  const isOwnProfile = useMemo(() => {
    return (!userId && !!user?.userId) || userId === user?.userId;
  }, [userId, user?.userId]);

  // Reset edit state and form data when component mounts or userId/profileUser changes
  useEffect(() => {
    setIsEditing(false);
    if (profileUser) {
      setName(profileUser.name || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [userId, profileUser]);

  // Query for profile
  const { isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["userProfile", userId || user?.userId],
    queryFn: async () => {
      try {
        const data = await blogService.getUserProfile(userId || user?.userId || "");
        setProfileUser(data);
        setName(data.name || "");
        return data;
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to load profile");
        throw error;
      }
    },
    enabled: (!!userId || !!user?.userId) && !!user,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
  });

  // Query for posts
  const { data: posts = [], isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ["userPosts", userId || user?.userId],
    queryFn: () => blogService.getUserPosts(userId || user?.userId || ""),
    enabled: (!!userId || !!user?.userId) && !!user,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
  });

  // Show loading state while either posts or profile is loading
  const isLoading = isLoadingPosts || isLoadingProfile;

  // Debounced upvote handler
  const debouncedUpvote = useCallback(
    debounce(async (postId: string, hasUpvoted: boolean) => {
      try {
        if (hasUpvoted) {
          await blogService.removeUpvote(postId);
        } else {
          await blogService.upvotePost(postId);
        }
        // Invalidate both user posts and individual post queries
        await queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        await queryClient.invalidateQueries({ queryKey: ["post", postId] });
      } catch (error) {
        console.error("Error handling upvote:", error);
        toast.error("Failed to update upvote");
        // Force refetch to sync with server state
        await queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      }
    }, 300),
    [queryClient]
  );

  const handleUpvote = async (postId: string) => {
    const post = posts.find((p: Post) => p.id === postId);
    if (!post) return;

    const hasUpvoted = post.upvotes.some(
      (upvote: { userId: string }) => upvote.userId === user?.userId
    );

    // Optimistic update
    queryClient.setQueryData<Post[]>(["userPosts", userId || user?.userId], (old) =>
      (old || []).map((p: Post) => {
        if (p.id === postId) {
          return {
            ...p,
            upvotes: hasUpvoted
              ? p.upvotes.filter((u: { userId: string }) => u.userId !== user?.userId)
              : [
                  ...p.upvotes,
                  {
                    userId: user?.userId || "",
                    postId,
                    id: "temp",
                    createdAt: new Date().toISOString(),
                  },
                ],
          };
        }
        return p;
      })
    );

    // Call debounced upvote
    debouncedUpvote(postId, hasUpvoted);
  };

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

  // Password validation
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  // Form validation
  const validateForm = () => {
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setError("Current password is required to change password");
        return false;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirm password do not match");
        return false;
      }
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        setError(passwordError);
        return false;
      }
    }
    return true;
  };

  const resetForm = () => {
    setName(profileUser?.name || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data: UpdateProfileData = {
        name: name.trim(),
        ...(newPassword && {
          currentPassword,
          newPassword,
        }),
      };

      const updatedProfile = await blogService.updateUserProfile(
        user?.userId || "",
        data
      );

      setProfileUser(updatedProfile);
      resetForm();
      setIsEditing(false);
      // Refetch profile data after successful update
      await refetchProfile();
      toast.success("Profile updated successfully");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;

    setIsDeleting(true);
    try {
      await blogService.deletePost(deletingPost.id);
      setShowDeleteConfirm(false);
      setDeletingPost(null);
      // Refetch posts after successful deletion
      await refetchPosts();
      toast.success("Post deleted successfully");
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteConfirm = (post: Post) => {
    setDeletingPost(post);
    setShowDeleteConfirm(true);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, reset form to current profile data
      resetForm();
    }
    setIsEditing(!isEditing);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingSpinner size="large" />
        </div>
      </MainLayout>
    );
  }

  if (error && !profileUser) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => navigate("/")} variant="primary">
            Go Home
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {isOwnProfile ? "My Profile" : `${profileUser?.name || profileUser?.email}'s Profile`}
              </h1>
              <p className="text-gray-600">{profileUser?.email}</p>
            </div>
            {isOwnProfile && (
              <Button
                onClick={handleEditToggle}
                variant="outline"
              >
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </Button>
            )}
          </div>

          {isOwnProfile && (
            <Card className="p-6 border border-gray-200">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password (required for password change)
                    </label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full mt-1"
                      placeholder="Current password"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password (optional)
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full mt-1"
                      placeholder="New password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full mt-1"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="border"
                    variant="primary"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Saving changes</span>
                        <LoadingSpinner size="small" />
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </form>
              ) : (
                <div>
                  <p className="text-gray-600">{profileUser?.name}</p>
                </div>
              )}
            </Card>
          )}
        </Card>

        {/* User's Posts */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Posts ({posts.length})
          </h2>
          <div className="grid gap-4 sm:gap-6">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <h3 className="text-2xl font-bold mb-2 hover:text-blue-600">
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant={post.upvotes.some(upvote => upvote.userId === user?.userId) ? "secondary" : "outline"}
                    size="sm"
                    className="flex items-center gap-1 border"
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
                  {post.createdAt ? formatDate(post.createdAt) : 'No date'}
                </div>
              </Card>
            ))}
            {posts.length === 0 && (
              <p className="text-gray-500 text-center py-8">
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

export default Profile;
