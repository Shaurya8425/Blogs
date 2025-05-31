import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/common/Input";
import { authService, SignupData } from "../services/auth";
import { useAuth } from "../hooks/useAuth";

export const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SignupData>({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // First sign up the user
      await authService.signup(formData);
      // Then log them in to update the auth context
      await login(formData.email, formData.password);
      navigate("/"); // Redirect to home page after successful signup
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='mt-6 text-center text-3xl font-inter font-extrabold text-gray-900'>
          Create your account
        </h2>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <Input
              label='Full Name'
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='John Doe'
            />

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
                className={`
                  w-full flex justify-center py-2 px-4 border border-transparent rounded-md
                  shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          <div className='relative'>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white text-gray-500'>
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Sign in
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
