import { api } from "./api";

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
}

export interface CreatePostData {
  title: string;
  content: string;
}

export const blogService = {
  getAllPosts: async (): Promise<Post[]> => {
    const response = await api.get<Post[]>("/blog");
    if (!response.data) {
      throw new Error("Failed to fetch posts");
    }
    // Sort posts by creation date in descending order (newest first)
    return response.data.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
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
    return response.data;
  },

  updatePost: async (id: string, data: CreatePostData): Promise<Post> => {
    const response = await api.put<Post>(`/blog/${id}`, data);
    if (!response.data) {
      throw new Error(`Failed to update post with id ${id}`);
    }
    return response.data;
  },

  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/blog/${id}`);
  },
};
