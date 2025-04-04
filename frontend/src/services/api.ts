import { ApiResponse, ApiError } from "../types/api";

// Use environment variable for backend URL with a fallback
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8787/api/v1";

// Ensure URL doesn't end with a slash
const formattedBaseUrl = BASE_URL.endsWith("/")
  ? BASE_URL.slice(0, -1)
  : BASE_URL;

// Helper to ensure endpoint starts with a slash
const formatEndpoint = (endpoint: string) =>
  endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

const handleResponse = async <T>(
  response: Response
): Promise<ApiResponse<T>> => {
  try {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (response.status === 401) {
      const isLoginEndpoint = response.url.includes('/auth/login');
      if (!isLoginEndpoint) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Session expired");
      } else {
        throw new Error("Invalid credentials");
      }
    }

    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP error! status: ${response.status}`;
      const errorDetails = data?.details ? ` Details: ${data.details}` : '';
      throw new Error(`${errorMessage}${errorDetails}`);
    }

    return { data, status: response.status };
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      console.log(
        `Making GET request to: ${formattedBaseUrl}${formatEndpoint(endpoint)}`
      );
      const response = await fetch(
        `${formattedBaseUrl}${formatEndpoint(endpoint)}`,
        {
          mode: 'cors',
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      return handleResponse<T>(response);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  post: async <T>(endpoint: string, body: any, isFormData = false): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      console.log(
        `Making POST request to: ${formattedBaseUrl}${formatEndpoint(endpoint)}`
      );
      const response = await fetch(
        `${formattedBaseUrl}${formatEndpoint(endpoint)}`,
        {
          method: "POST",
          mode: 'cors',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(!isFormData && { "Content-Type": "application/json" }),
          },
          body: isFormData ? body : JSON.stringify(body),
        }
      );
      return handleResponse<T>(response);
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },

  put: async <T>(endpoint: string, body: any, isFormData = false): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${formattedBaseUrl}${formatEndpoint(endpoint)}`,
        {
          method: "PUT",
          mode: 'cors',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(!isFormData && { "Content-Type": "application/json" }),
          },
          body: isFormData ? body : JSON.stringify(body),
        }
      );
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${formattedBaseUrl}${formatEndpoint(endpoint)}`,
        {
          method: "DELETE",
          mode: 'cors',
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  },
};
