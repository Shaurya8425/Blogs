import { api } from "./api";
import { queryClient } from "./blog";

export interface User {
  id?: string;
  userId?: string;
  email: string;
  name: string | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token: string;
  message: string;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", data);
      if (!response.data) {
        throw new Error("No response data from login");
      }
      localStorage.setItem("token", response.data.token);
      await queryClient.resetQueries();
      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      throw error;
    }
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>("/auth/signup", data);
      if (!response.data) {
        throw new Error("No response data from signup");
      }
      localStorage.setItem("token", response.data.token);
      await queryClient.resetQueries();
      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    queryClient.clear();
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>("/auth/me");
      if (!response.data) {
        throw new Error("No user data found");
      }
      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      throw error;
    }
  },
};
