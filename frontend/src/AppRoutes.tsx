import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { CreatePost } from "./pages/CreatePost";
import { EditPost } from "./pages/EditPost";
import { PostDetail } from "./pages/PostDetail";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/post/:postId" element={<PostDetail />} />
      <Route
        path="/post/:postId/edit"
        element={
          <ProtectedRoute>
            <EditPost />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreatePost />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
