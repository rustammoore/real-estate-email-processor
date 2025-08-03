import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    recentProperties: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const properties = await api.getProperties();
      const activeProperties = properties.filter(p => p.status === 'active');
      
      setStats({
        totalProperties: properties.length,
        activeProperties: activeProperties.length,
        recentProperties: properties.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProcessEmails = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await api.processEmails();
      setMessage('Emails processed successfully!');
      fetchStats(); // Refresh stats
    } catch (error) {
      setMessage('Error processing emails: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.totalProperties}</Typography>
                  <Typography color="textSecondary">Total Properties</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.activeProperties}</Typography>
                  <Typography color="textSecondary">Active Properties</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={handleProcessEmails}
                disabled={loading}
                fullWidth
                sx={{ height: 80 }}
              >
                {loading ? 'Processing...' : 'Process Emails'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Properties */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Properties</Typography>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={fetchStats}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              
              {stats.recentProperties.length === 0 ? (
                <Typography color="textSecondary">No properties found</Typography>
              ) : (
                <Grid container spacing={2}>
                  {stats.recentProperties.map((property) => (
                    <Grid item xs={12} sm={6} md={4} key={property.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" noWrap>
                            {property.title}
                          </Typography>
                          <Typography color="textSecondary" noWrap>
                            {property.email_source}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {new Date(property.created_at).toLocaleDateString()}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => navigate(`/properties/${property.id}`)}
                            sx={{ mt: 1 }}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard; 