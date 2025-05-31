import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/common/Input";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { X } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      navigate("/"); // Redirect to home page after successful login
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='mt-6 text-center text-4xl font-inter font-extrabold text-gray-900'>
          Sign in to your account
        </h2>
      </div>

      <div className='mt-4 sm:mx-auto sm:w-full sm:max-w-md'>
        {/* 👇 Relative container for the X button positioning */}
        <div className='relative bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          {/* ❌ Close Button */}
          <button
            onClick={() => navigate("/")}
            className='absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-100 transition'
            aria-label='Close'
          >
            <X className='w-4 h-4 text-gray-700' />
          </button>

          <form className='space-y-6' onSubmit={handleSubmit}>
            <Input
              label='Email address'
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <Input
              label='Password'
              type='password'
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            {error && <div className='text-red-600 text-sm'>{error}</div>}

            <div>
              <button
                type='submit'
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <div className='bg-white px-1 rounded text-black flex items-center gap-2'>
                    Signing
                    <LoadingSpinner size='small' />
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <div className='relative mt-6'>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white text-gray-500'>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Sign up
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
