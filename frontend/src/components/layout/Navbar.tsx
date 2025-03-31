import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth";

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <nav className='bg-white shadow'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex'>
            <Link to='/' className='flex items-center'>
              <span className='text-xl font-bold text-gray-900'>
                sForStudy Blogs
              </span>
            </Link>
          </div>

          <div className='flex-1 flex justify-center items-center'>
            {user && (
              <div className='flex flex-col items-center'>
                <span className='text-sm text-gray-500'>{getGreeting()}</span>
                <span className='text-sm font-medium text-gray-900'>
                  {user.name || user.email}
                </span>
              </div>
            )}
          </div>

          <div className='flex items-center space-x-4'>
            {user ? (
              <>
                <Link
                  to='/create'
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                >
                  Write A Story
                </Link>
                <button
                  onClick={handleLogout}
                  className='inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200'
                >
                  Logout
                </button>
              </>
            ) : (
              <div className='space-x-4'>
                <Link to='/login' className='text-gray-600 hover:text-gray-900'>
                  Login
                </Link>
                <Link
                  to='/signup'
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
