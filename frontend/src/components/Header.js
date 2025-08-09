import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Divider,
  Stack
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
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../contexts/AuthContext';
import { useCounts } from '../contexts/CountsContext';

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { counts } = useCounts();
  const pendingCount = counts?.pendingReview || 0;
  const archivedCount = counts?.archived || 0;
  const deletedCount = counts?.deleted || 0;
  const followUpsDue = counts?.followUps?.due || 0;
  const badgeBaseSx = {
    height: 20,
    width: 20,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: 'white'
  };

  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 1.5, py: 0.25 }}>
        {/* Top row: compact main nav */}
        <Toolbar disableGutters sx={{ minHeight: 36 }}>
          <BusinessIcon sx={{ mr: 1, color: 'text.primary' }} />
          <Typography variant="subtitle2" component="div" sx={{ flexGrow: 1, fontWeight: 600, lineHeight: 1 }}>
            Real Estate Email Processor
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Button size="small" color="inherit" component={RouterLink} to="/" startIcon={<HomeIcon />}>Dashboard</Button>
            <Button size="small" color="inherit" component={RouterLink} to="/properties" startIcon={<BusinessIcon />}>Properties</Button>
            {isAuthenticated ? (
              <>
                <Button size="small" color="inherit" component={RouterLink} to="/profile" startIcon={<AccountCircleIcon />}>Profile</Button>
                <Button
                  size="small"
                  variant="contained"
                  color="inherit"
                  onClick={logout}
                  startIcon={<LogoutIcon />}
                  sx={{ bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'black' } }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button size="small" variant="contained" color="inherit" component={RouterLink} to="/auth" startIcon={<LoginIcon />} sx={{ bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'black' } }}>
                Login
              </Button>
            )}
          </Stack>
        </Toolbar>

        <Divider />

        {/* Bottom row: compact secondary nav with colored count chips */}
        <Toolbar disableGutters sx={{ minHeight: 32, gap: 0.5, mt: 0.25, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/properties/new"
            sx={{
              bgcolor: 'text.primary',
              color: 'background.paper',
              '&:hover': { bgcolor: 'black' }
            }}
          >
            Add Property
          </Button>
          <Button size="small" color="inherit" component={RouterLink} to="/follow-ups" startIcon={<EventNoteIcon sx={{ color: '#2563eb' }} />}
            endIcon={<Box component="span" sx={{ ...badgeBaseSx, bgcolor: '#2563eb' }}>{followUpsDue}</Box>}>
            Follow-ups
          </Button>
          <Button size="small" color="inherit" component={RouterLink} to="/pending-review" startIcon={<AccessTimeIcon sx={{ color: '#f59e0b' }} />}
            endIcon={<Box component="span" sx={{ ...badgeBaseSx, bgcolor: '#f59e0b' }}>{pendingCount}</Box>}>
            Pending Review
          </Button>
          <Button size="small" color="inherit" component={RouterLink} to="/archived" startIcon={<ArchiveIcon sx={{ color: '#10b981' }} />}
            endIcon={<Box component="span" sx={{ ...badgeBaseSx, bgcolor: '#10b981' }}>{archivedCount}</Box>}>
            Archived
          </Button>
          <Button size="small" color="inherit" component={RouterLink} to="/deleted-properties" startIcon={<DeleteOutlineIcon sx={{ color: '#ef4444' }} />}
            endIcon={<Box component="span" sx={{ ...badgeBaseSx, bgcolor: '#ef4444' }}>{deletedCount}</Box>}>
            Deleted
          </Button>
        </Toolbar>
      </Box>
    </AppBar>
  );
}

export default Header; 