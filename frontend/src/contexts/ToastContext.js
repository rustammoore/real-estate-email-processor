import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
    title: '',
    autoHideDuration: 6000
  });

  const showToast = useCallback(({ message, severity = 'info', title = '', autoHideDuration = 6000 }) => {
    setToast({
      open: true,
      message,
      severity,
      title,
      autoHideDuration
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  const showSuccess = useCallback((message, title = 'Success') => {
    showToast({ message, severity: 'success', title });
  }, [showToast]);

  const showError = useCallback((message, title = 'Error') => {
    showToast({ message, severity: 'error', title });
  }, [showToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    showToast({ message, severity: 'warning', title });
  }, [showToast]);

  const showInfo = useCallback((message, title = 'Info') => {
    showToast({ message, severity: 'info', title });
  }, [showToast]);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        title={toast.title}
        autoHideDuration={toast.autoHideDuration}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}; 