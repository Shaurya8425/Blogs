import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppRoutes } from "./AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position='top-right' />
      </AuthProvider>
    </Router>
  );
}

export default App;
