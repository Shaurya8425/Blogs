import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export const Navbar = () => {
  const { user, logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  if (isLoading) {
    return (
      <nav className='bg-white shadow-sm sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <div className='h-8 w-20 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className='bg-white shadow-sm sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Left section */}
          <div className='flex items-center'>
            <Link
              to='/'
              className='text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors'
            >
              InkFlow
            </Link>
          </div>

          {/* Center section - Welcome message */}
          {user && (
            <div className='hidden md:flex items-center justify-center flex-1 mx-4'>
              <span className='text-gray-600'>
                Welcome,{" "}
                <span className='font-medium text-blue-600'>
                  {user.name || "User"}
                </span>
                !
              </span>
            </div>
          )}

          {/* Right section */}
          <div className='hidden md:flex md:items-center md:space-x-4'>
            <Link
              to='/'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  to='/create'
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors'
                >
                  Create Post
                </Link>
                <Link
                  to='/profile'
                  className='inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                >
                  Profile
                </Link>
                <Button
                  onClick={handleLogout}
                  variant='danger'
                  className='ml-2'
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  to='/login'
                  className='inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                >
                  Login
                </Link>
                <Link
                  to='/signup'
                  className='inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='flex items-center md:hidden'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
            >
              <span className='sr-only'>Open main menu</span>
              {isMenuOpen ? (
                <X className='block h-6 w-6' aria-hidden='true' />
              ) : (
                <Menu className='block h-6 w-6' aria-hidden='true' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
        <div className='pt-2 pb-3 space-y-1'>
          {user && (
            <div className='px-4 py-2 text-sm text-center text-gray-600 border-b border-gray-200'>
              Welcome,{" "}
              <span className='font-medium text-blue-600'>
                {user.name || "User"}
              </span>
              !
            </div>
          )}
          <Link
            to='/'
            className='block px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          {user ? (
            <>
              <Link
                to='/create'
                className='block px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                onClick={() => setIsMenuOpen(false)}
              >
                Create Post
              </Link>
              <Link
                to='/profile'
                className='block px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className='block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50'
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to='/login'
                className='block px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to='/signup'
                className='block px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
