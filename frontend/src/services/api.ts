import { ApiResponse } from "../types/api";

// Use local backend URL for development
const BASE_URL = "http://localhost:8787/api/v1";

export const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${endpoint}`, {
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

  post: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
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
