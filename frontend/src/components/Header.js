import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../contexts/AuthContext';
import { useArchivedCount, useDeletedCount, usePendingReviewCount, useFollowUpCount } from '../hooks';

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { count: pendingCount } = usePendingReviewCount();
  const { count: archivedCount } = useArchivedCount();
  const { count: deletedCount } = useDeletedCount();
  const { followUpCounts } = useFollowUpCount();
  const followUpsDue = followUpCounts?.due || 0;
  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar>
        <BusinessIcon sx={{ mr: 2, color: 'text.primary' }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Real Estate Email Processor
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/" startIcon={<HomeIcon />}>Dashboard</Button>
          <Button color="inherit" component={RouterLink} to="/properties" startIcon={<BusinessIcon />}>Properties</Button>
          <Button color="inherit" component={RouterLink} to="/pending-review" startIcon={<AccessTimeIcon />}>{`Pending Review (${pendingCount})`}</Button>
          <Button color="inherit" component={RouterLink} to="/archived" startIcon={<ArchiveIcon />}>{`Archived (${archivedCount})`}</Button>
          <Button color="inherit" component={RouterLink} to="/deleted-properties" startIcon={<DeleteOutlineIcon />}>{`Deleted (${deletedCount})`}</Button>
          <Button color="inherit" component={RouterLink} to="/follow-ups" startIcon={<EventNoteIcon />}>{`Follow-ups (${followUpsDue})`}</Button>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/profile" startIcon={<AccountCircleIcon />}>Profile</Button>
              <Button variant="contained" color="inherit" onClick={logout} startIcon={<LogoutIcon />} sx={{ bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'black' }, ml: 1 }}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="contained" color="inherit" component={RouterLink} to="/auth" startIcon={<LoginIcon />} sx={{ bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'black' } }}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 