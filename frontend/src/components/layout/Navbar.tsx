import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth";
import { useState } from "react";

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
    setIsMenuOpen(false);
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
          {/* Logo */}
          <div className='flex-shrink-0 flex items-center'>
            <Link to='/' className='flex items-center'>
              <span className='text-xl font-bold text-gray-900 whitespace-nowrap'>
                sForStudy Blogs
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className='hidden md:flex md:items-center md:space-x-4'>
            {/* Greeting - Desktop */}
            {user && (
              <div className='flex flex-col items-center mr-4'>
                <span className='text-sm text-gray-500'>{getGreeting()}</span>
                <span className='text-sm font-medium text-gray-900'>
                  {user.name || user.email}
                </span>
              </div>
            )}

            {/* Navigation Links - Desktop */}
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

          {/* Mobile menu button */}
          <div className='md:hidden flex items-center'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
              aria-expanded='false'
            >
              <span className='sr-only'>Open main menu</span>
              {/* Menu icon */}
              {!isMenuOpen ? (
                <svg
                  className='block h-6 w-6'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              ) : (
                <svg
                  className='block h-6 w-6'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className='md:hidden'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {user && (
              <div className='flex flex-col items-center py-2 border-b border-gray-200'>
                <span className='text-sm text-gray-500'>{getGreeting()}</span>
                <span className='text-sm font-medium text-gray-900'>
                  {user.name || user.email}
                </span>
              </div>
            )}
            {user ? (
              <div className='flex flex-col space-y-2 px-2'>
                <Link
                  to='/create'
                  onClick={() => setIsMenuOpen(false)}
                  className='block px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md'
                >
                  Write A Story
                </Link>
                <button
                  onClick={handleLogout}
                  className='block w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md'
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className='flex flex-col space-y-2 px-2'>
                <Link
                  to='/login'
                  onClick={() => setIsMenuOpen(false)}
                  className='block px-4 py-2 text-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                >
                  Login
                </Link>
                <Link
                  to='/signup'
                  onClick={() => setIsMenuOpen(false)}
                  className='block px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md'
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
