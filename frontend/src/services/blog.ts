import { api } from "./api";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache is kept for 30 minutes (renamed from cacheTime in v5)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export interface Reply {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface Upvote {
  id: string;
  createdAt: string;
  userId: string;
  postId: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  author: {
    id: string;
    email: string;
    name: string | null;
  };
  upvotes: Upvote[];
  replies: Reply[];
}

export interface CreatePostData {
  title: string;
  content: string;
}

export interface CreateReplyData {
  content: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
}

export interface UpdateProfileData {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const blogService = {
  getAllPosts: async (): Promise<Post[]> => {
    try {
      const response = await api.get<Post[]>("/blog");
      if (!response.data) {
        throw new Error("Failed to fetch posts");
      }
      return response.data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  },

  getPostById: async (id: string): Promise<Post> => {
    const response = await api.get<Post>(`/blog/${id}`);
    if (!response.data) {
      throw new Error(`Post with id ${id} not found`);
    }
    return response.data;
  },

  createPost: async (data: CreatePostData): Promise<Post> => {
    const response = await api.post<Post>("/blog", data);
    if (!response.data) {
      throw new Error("Failed to create post");
    }
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
    return response.data;
  },

  updatePost: async (id: string, data: CreatePostData): Promise<Post> => {
    const response = await api.put<Post>(`/blog/${id}`, data);
    if (!response.data) {
      throw new Error(`Failed to update post with id ${id}`);
    }
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
    await queryClient.invalidateQueries({ queryKey: ["post", id] });
    return response.data;
  },

  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/blog/${id}`);
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
  },

  upvotePost: async (postId: string): Promise<Upvote> => {
    try {
      const response = await api.post<Upvote>(`/blog/${postId}/upvote`, {});
      if (!response.data) {
        throw new Error("Failed to upvote post");
      }
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["post", postId] });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  removeUpvote: async (postId: string): Promise<void> => {
    try {
      await api.delete(`/blog/${postId}/upvote`);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  addReply: async (postId: string, data: CreateReplyData): Promise<Reply> => {
    const response = await api.post<Reply>(`/blog/${postId}/replies`, data);
    if (!response.data) {
      throw new Error("Failed to add reply");
    }
    return response.data;
  },

  deleteReply: async (postId: string, replyId: string): Promise<void> => {
    await api.delete(`/blog/${postId}/replies/${replyId}`);
  },

  getUserProfile: async (userId: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${userId}`);
    if (!response.data) {
      throw new Error("Failed to fetch user profile");
    }
    return response.data;
  },

  updateUserProfile: async (
    userId: string,
    data: UpdateProfileData
  ): Promise<UserProfile> => {
    const response = await api.put<UserProfile>(`/users/${userId}`, data);
    if (!response.data) {
      throw new Error("Failed to update user profile");
    }
    return response.data;
  },

  getUserPosts: async (userId: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/users/${userId}/posts`);
    if (!response.data) {
      throw new Error("Failed to fetch user posts");
    }
    return response.data;
  },
};
