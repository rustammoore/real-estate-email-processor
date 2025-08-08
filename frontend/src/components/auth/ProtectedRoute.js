import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If user should not be authenticated (like login/register pages) but is authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render children if authentication requirements are met
  return children;
};

export default ProtectedRoute;