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

function Header() {
  const { isAuthenticated, logout } = useAuth();
  return (
    <AppBar position="static">
      <Toolbar>
        <BusinessIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Real Estate Email Processor
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<HomeIcon />}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/properties"
            startIcon={<BusinessIcon />}
          >
            Properties
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/pending-review"
            startIcon={<AccessTimeIcon />}
          >
            Pending Review
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/archived"
            startIcon={<ArchiveIcon />}
          >
            Archived
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/deleted-properties"
            startIcon={<DeleteOutlineIcon />}
          >
            Deleted
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/follow-ups"
            startIcon={<EventNoteIcon />}
          >
            Follow-ups
          </Button>
          {isAuthenticated ? (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/profile"
                startIcon={<AccountCircleIcon />}
              >
                Profile
              </Button>
              <Button
                color="inherit"
                onClick={logout}
                startIcon={<LogoutIcon />}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              component={RouterLink}
              to="/auth"
              startIcon={<LoginIcon />}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 