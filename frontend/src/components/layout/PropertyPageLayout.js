import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import BackButton from '../ui/BackButton';

function PropertyPageLayout({
  title,
  actions = null,
  onBack = null,
  backLabel = 'Back',
  maxWidth = 'lg',
  children,
  dense = false,
}) {
  return (
    <Container maxWidth={maxWidth} sx={{ mt: dense ? 1 : 2, mb: dense ? 1 : 2 }}>
      {(onBack || title || actions) && (
        <Box sx={{ mb: dense ? 1 : 2 }}>
          {onBack && (
            <BackButton onClick={onBack} label={backLabel} />
          )}

          {(title || actions) && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ m: 0 }}>
                {title}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {actions}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {children}
    </Container>
  );
}

export default PropertyPageLayout;


