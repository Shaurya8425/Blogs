import { api } from "./api";

export interface User {
  id?: string;
  userId?: string;
  email: string;
  name: string | null;
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
  user: User;
  token: string;
  message: string;
}

interface LoginResponse {
  id: string;
  email: string;
  name: string | null;
  token: string;
  message: string;
}

interface SignupResponse {
  id: string;
  email: string;
  name: string | null;
  token: string;
  message: string;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const loginData = {
        username: data.email,
        password: data.password,
      };
      const response = await api.post<LoginResponse>("/login", loginData);
      if (!response.data) {
        throw new Error("No data received from server");
      }
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return {
        user: {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
        },
        token: response.data.token,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    try {
      const signupData = {
        username: data.email,
        password: data.password,
        name: data.name,
      };
      const response = await api.post<SignupResponse>("/signup", signupData);
      if (!response.data) {
        throw new Error("No data received from server");
      }
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return {
        user: {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
        },
        token: response.data.token,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<{ message: string; user: User }>("/me");
      if (!response.data?.user) {
        throw new Error("No user data received from server");
      }
      return response.data.user;
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  },
};
