import { ApiResponse } from "../types/api";

// Use environment variable for backend URL, ensuring it doesn't end with a slash
const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/")
  ? import.meta.env.VITE_API_URL.slice(0, -1)
  : import.meta.env.VITE_API_URL;

// Helper to ensure endpoint starts with a slash
const formatEndpoint = (endpoint: string) =>
  endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

export const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${formatEndpoint(endpoint)}`, {
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
      const response = await fetch(`${BASE_URL}${formatEndpoint(endpoint)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const response = await fetch(`${BASE_URL}${formatEndpoint(endpoint)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}${formatEndpoint(endpoint)}`, {
        method: "DELETE",
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
};
