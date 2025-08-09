import React from 'react';
import '../../styles/FollowUpBadge.css';

const FollowUpBadge = ({ followUpDate }) => {
  if (!followUpDate) return null;

  const now = new Date();
  const followUp = new Date(followUpDate);
  const diffTime = followUp - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  const displayDays = Math.abs(diffDays);
  
  const getClassName = () => {
    if (isOverdue) return 'follow-up-badge overdue';
    if (diffDays <= 3) return 'follow-up-badge urgent';
    if (diffDays <= 7) return 'follow-up-badge soon';
    return 'follow-up-badge normal';
  };

  const getLabel = () => {
    if (isOverdue) {
      if (displayDays === 1) return '1 day overdue';
      if (displayDays < 30) return `${displayDays} days overdue`;
      if (displayDays < 365) return `${Math.floor(displayDays / 30)} months overdue`;
      return `${Math.floor(displayDays / 365)} years overdue`;
    }
    
    if (displayDays === 1) return '1 day';
    if (displayDays < 30) return `${displayDays} days`;
    if (displayDays < 365) return `${Math.floor(displayDays / 30)} months`;
    return `${Math.floor(displayDays / 365)} years`;
  };

  return (
    <div className={getClassName()}>
      <svg className="timer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span className="follow-up-text">{getLabel()}</span>
    </div>
  );
};

export default FollowUpBadge;