import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import PropertyList from './components/PropertyList';
import PropertyDetail from './components/PropertyDetail';
import Dashboard from './components/Dashboard';
import ArchivedProperties from './components/ArchivedProperties';
import DeletedProperties from './components/DeletedProperties';
import PendingReview from './components/PendingReview';
import FollowUps from './components/FollowUps';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthWrapper from './components/auth/AuthWrapper';
import UserProfile from './components/UserProfile';
import PropertyForm from './components/PropertyForm';
import { useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
    primary: {
      main: '#111827',
      contrastText: '#ffffff',
    },
    divider: '#e5e7eb',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ].join(','),
    fontWeightMedium: 600,
  },
});

function AppShell() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const showHeader = isAuthenticated && location.pathname !== '/auth';

  return (
    <div className="App">
      {showHeader && <Header />}
      <Routes>
        <Route path="/auth" element={<AuthWrapper />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties"
          element={
            <ProtectedRoute>
              <PropertyList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/new"
          element={
            <ProtectedRoute>
              <PropertyForm mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id"
          element={
            <ProtectedRoute>
              <PropertyDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/archived"
          element={
            <ProtectedRoute>
              <ArchivedProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deleted-properties"
          element={
            <ProtectedRoute>
              <DeletedProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending-review"
          element={
            <ProtectedRoute>
              <PendingReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/follow-ups"
          element={
            <ProtectedRoute>
              <FollowUps />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppShell />
      </Router>
    </ThemeProvider>
  );
}

export default App; 