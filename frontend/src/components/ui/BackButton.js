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
    if (typeof onClick === 'function') {
      onClick();
      return;
    }
    try {
      if (window.history && window.history.length > 1) {
        navigate(-1);
      } else if (to) {
        navigate(to);
      } else {
        navigate('/');
      }
    } catch (_) {
      if (to) navigate(to);
      else navigate('/');
    }
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


