import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRole: 'admin' | 'employee';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole }) => {
  const { user, isAuthenticated } = useAuth();

  // Not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but wrong role
  if (user?.role !== allowedRole) {
    // Redirect admin to admin dashboard
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    // Redirect employee to employee dashboard
    if (user?.role === 'employee') {
      return <Navigate to="/employee" replace />;
    }
    // Fallback to home
    return <Navigate to="/" replace />;
  }

  // User has correct role
  return <Outlet />;
};

export default ProtectedRoute;