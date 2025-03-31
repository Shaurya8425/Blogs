import { ApiResponse } from "../types/api";

// Use environment variable for backend URL
const BASE_URL = import.meta.env.VITE_API_URL;

export const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  post: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  put: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },
};
