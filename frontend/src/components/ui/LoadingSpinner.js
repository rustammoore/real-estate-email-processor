import React from 'react';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'medium', 
  variant = 'circular',
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;

  const spinner = (
    <svg 
      className={`animate-spin ${spinnerSize} text-blue-600`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${
      fullScreen ? 'fixed inset-0 bg-white bg-opacity-90 z-[9999]' : ''
    }`}>
      {spinner}
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );

  return content;
};

export default LoadingSpinner;