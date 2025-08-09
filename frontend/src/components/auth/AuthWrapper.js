import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';
import Register from './Register';
import LandingPage from '../LandingPage';
import LoadingSpinner from '../ui/LoadingSpinner';

const AuthWrapper = () => {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'login', 'register'
  const { isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Only show loading if we're checking auth and there's a possibility the user is authenticated
  // If no user data and not authenticated, show the auth forms immediately
  if (isLoading && (isAuthenticated || user)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <Login 
            onSwitchToRegister={() => setCurrentView('register')}
            onBackToHome={() => setCurrentView('landing')}
          />
        );
      case 'register':
        return (
          <Register 
            onSwitchToLogin={() => setCurrentView('login')}
            onBackToHome={() => setCurrentView('landing')}
          />
        );
      default:
        return (
          <LandingPage 
            onGetStarted={() => setCurrentView('login')}
          />
        );
    }
  };

  return renderCurrentView();
};

export default AuthWrapper;