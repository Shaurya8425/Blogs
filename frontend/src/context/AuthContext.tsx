import { createContext, useState, useEffect, ReactNode } from "react";
import { authService } from "../services/auth";

interface JWTPayload {
  userId: string;
  email: string;
  name?: string | null;
  iat: number;
  exp: number;
}

interface AuthContextType {
  user: JWTPayload | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const userData = await authService.getCurrentUser();
        // The user data from /me endpoint is different from the JWT payload
        // We need to use the JWT payload structure for consistency
        setUser({
          userId: userData.id || userData.userId || "",
          email: userData.email,
          name: userData.name,
          iat: 0, // These values don't matter for our use case
          exp: 0,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error loading user:", err);
      setError("Failed to load user data");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.login({ email, password });
      await loadUser(); // Reload user data after successful login
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Failed to login");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
