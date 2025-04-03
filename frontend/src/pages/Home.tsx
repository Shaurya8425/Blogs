import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Post, blogService, queryClient } from "../services/blog";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { DeleteConfirmation } from "../components/common/DeleteConfirmation";
import { ThumbsUp } from "lucide-react";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/common/LoadingSpinner"; // Import LoadingSpinner component

export const Home = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: blogService.getAllPosts,
    enabled: !!user, // Only fetch if user is logged in
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

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

  const handleUpvote = async (postId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const hasUpvoted = post.upvotes.some(
        (upvote) => upvote.userId === user.userId
      );

      // Make API call
      if (hasUpvoted) {
        await blogService.removeUpvote(postId);
      } else {
        await blogService.upvotePost(postId);
      }

      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["post", postId] });
      await queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    } catch (error) {
      console.error("Error handling upvote:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;

    setIsDeleting(true);
    try {
      await blogService.deletePost(selectedPost.id);
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setSelectedPost(null);
    }
  };

  const openDeleteConfirm = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    setSelectedPost(post);
    setShowDeleteConfirm(true);
  };

  const renderPost = (post: Post) => {
    const isAuthor = user?.userId === post.author.id;
    const hasUpvoted = post.upvotes.some(
      (upvote) => upvote.userId === user?.userId
    );

    return (
      <Card
        key={post.id}
        className="p-6 mb-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white border border-gray-200"
        onClick={() => navigate(`/post/${post.id}`)}
      >
        <h2 className="text-2xl font-bold mb-2 line-clamp-2 hover:line-clamp-none transition-all">
          {post.title}
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-3 hover:line-clamp-none transition-all">
          {post.content}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-sm">
              <span className="text-gray-500">
                By {post.author?.name || "Unknown"}
              </span>
              <span className="text-gray-400 text-xs">
                {formatDate(post.createdAt)}
              </span>
            </div>
            <Button
              variant={hasUpvoted ? "secondary" : "outline"}
              size="sm"
              className="flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                handleUpvote(post.id);
              }}
            >
              <ThumbsUp
                className={`w-4 h-4 ${hasUpvoted ? "fill-current" : ""}`}
              />
              <span>{post.upvotes.length}</span>
            </Button>
          </div>
          {isAuthor && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/post/${post.id}/edit`);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteConfirm(e, post);
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (isAuthLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {!user ? (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to sForStudy Blogs</h2>
            <p className="text-gray-600 mb-6">
              Please log in to access the blog posts and interact with the
              community.
            </p>
            <Button variant="primary" onClick={() => navigate("/login")}>
              Log In to Continue
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-6">
              {posts.map((post) => renderPost(post))}
            </div>
            {showDeleteConfirm && (
              <DeleteConfirmation
                onConfirm={handleDelete}
                onCancel={() => {
                  setShowDeleteConfirm(false);
                  setSelectedPost(null);
                }}
                isLoading={isDeleting}
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Home;
