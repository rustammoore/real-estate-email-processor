import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';
import { getErrorMessage } from '../utils';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getAuthToken();
      
      if (token && api.isAuthenticated()) {
        try {
          const response = await api.getCurrentUser();
          const payload = response?.data?.data || response?.data || {};
          const user = payload.user || response?.data?.user;

          if (user) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
            // Store user in localStorage for persistence
            localStorage.setItem('user', JSON.stringify(user));
          } else {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid token
          api.setAuthToken(null);
          localStorage.removeItem('user');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        // Check if we have stored user data from a previous session
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser && token) {
            const user = JSON.parse(storedUser);
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
          } else {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } catch (error) {
          localStorage.removeItem('user');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      }
    };

    checkAuth();
  }, []);

  // Listen for logout events (from API interceptor)
  useEffect(() => {
    const handleLogoutEvent = () => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.login(credentials);
      const payload = response?.data?.data || response?.data || {};
      const user = payload.user || response?.data?.user;
      const token = payload.token || response?.data?.token;
      
      // Store token and user
      api.setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.register(userData);
      const payload = response?.data?.data || response?.data || {};
      const user = payload.user || response?.data?.user;
      const token = payload.token || response?.data?.token;
      
      // Store token and user
      api.setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      api.setAuthToken(null);
      localStorage.removeItem('user');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.updateProfile(profileData);
      const payload = response?.data?.data || response?.data || {};
      const updatedUser = payload.user || response?.data?.user;
      
      // Update stored user
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      await api.changePassword(passwordData);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Update email config function
  const updateEmailConfig = async (emailConfig) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.updateEmailConfig(emailConfig);
      const payload = response?.data?.data || response?.data || {};
      
      // Update the user with new email config status
      const updatedUser = {
        ...state.user,
        emailConfig: payload.emailConfig || response?.data?.emailConfig
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateEmailConfig,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;