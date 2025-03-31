import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
