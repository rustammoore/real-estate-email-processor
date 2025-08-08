import React from 'react';
import { STATUS_CONFIG } from '../../constants';

const StatusBadge = ({ status, size = 'small', variant = 'outlined' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  
  const getColorClasses = () => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";
    
    switch (config.color) {
      case 'success':
        return variant === 'outlined' 
          ? `${baseClasses} border border-green-200 text-green-700 bg-green-50`
          : `${baseClasses} bg-green-100 text-green-800`;
      case 'warning':
        return variant === 'outlined'
          ? `${baseClasses} border border-yellow-200 text-yellow-700 bg-yellow-50`
          : `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'error':
        return variant === 'outlined'
          ? `${baseClasses} border border-red-200 text-red-700 bg-red-50`
          : `${baseClasses} bg-red-100 text-red-800`;
      default:
        return variant === 'outlined'
          ? `${baseClasses} border border-blue-200 text-blue-700 bg-blue-50`
          : `${baseClasses} bg-blue-100 text-blue-800`;
    }
  };
  
  return (
    <span className={getColorClasses()}>
      <span className="text-sm">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge; 