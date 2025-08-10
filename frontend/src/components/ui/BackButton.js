import React from 'react';
import { Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

function BackButton({
  to = '/',
  label = 'Back',
  onClick = null,
  size = 'small',
  sx = {}
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Always prefer navigating back in history when possible
    try {
      const hasHistory = typeof window !== 'undefined' && window.history && window.history.length > 1;
      if (hasHistory) {
        navigate(-1);
        return;
      }
    } catch (_) {
      // ignore and try fallbacks below
    }

    // Fallback: use provided handler if any
    if (typeof onClick === 'function') {
      try {
        onClick();
        return;
      } catch (_) {
        // ignore and try final route fallback
      }
    }

    // Final fallback: use provided route or home
    if (to) navigate(to);
    else navigate('/');
  };

  return (
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={handleClick}
      size={size}
      sx={{ mb: 1, ...sx }}
    >
      {label}
    </Button>
  );
}

export default BackButton;


