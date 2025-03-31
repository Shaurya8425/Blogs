import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../common/Button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <nav className='bg-white shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex'>
            <div className='flex-shrink-0 flex items-center'>
              <Link to='/' className='text-xl font-bold text-gray-800'>
                Blog
              </Link>
            </div>
          </div>

          <div className='hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4'>
            <Link
              to='/'
              className='text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium'
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  to='/create'
                  className='text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium'
                >
                  Create Post
                </Link>
                <Link
                  to='/profile'
                  className='text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium'
                >
                  Profile
                </Link>
                <Button onClick={handleLogout} variant='danger'>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  to='/login'
                  className='text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium'
                >
                  Login
                </Link>
                <Link
                  to='/register'
                  className='text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium'
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <div className='flex items-center sm:hidden'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
            >
              <span className='sr-only'>Open main menu</span>
              {isMenuOpen ? (
                <X className='block h-6 w-6' />
              ) : (
                <Menu className='block h-6 w-6' />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className='sm:hidden'>
          <div className='pt-2 pb-3 space-y-1'>
            <Link
              to='/'
              className='block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  to='/create'
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                >
                  Create Post
                </Link>
                <Link
                  to='/profile'
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className='block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-gray-50'
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to='/login'
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                >
                  Login
                </Link>
                <Link
                  to='/register'
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
