import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Car, Menu, X, User, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  const navigateToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'employee') {
      navigate('/employee');
    }
    closeMenu();
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Car className="h-8 w-8" />
            <span className="text-xl font-bold">ParkEase</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="hover:text-blue-200 transition-colors">Home</Link>
            
            {isAuthenticated ? (
              <>
                <button 
                  onClick={navigateToDashboard}
                  className="hover:text-blue-200 transition-colors"
                >
                  Dashboard
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <button 
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-2 space-y-3">
            <Link 
              to="/" 
              className="block hover:bg-blue-700 px-3 py-2 rounded-md"
              onClick={closeMenu}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <button 
                  onClick={navigateToDashboard}
                  className="block text-left w-full hover:bg-blue-700 px-3 py-2 rounded-md"
                >
                  Dashboard
                </button>
                <div className="pt-2 border-t border-blue-500">
                  <div className="px-3 py-1 text-sm font-medium text-blue-200">
                    Signed in as {user?.name}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full hover:bg-blue-700 px-3 py-2 rounded-md"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded-md"
                onClick={closeMenu}
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;