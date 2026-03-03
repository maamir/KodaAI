import { Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { usePageTracking } from '@/hooks/useAnalytics';

export function CustomDashboard() {
  usePageTracking('Custom Dashboard');
  const navigate = useNavigate();

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Custom Dashboard</Typography>
        <Button variant="contained" onClick={() => navigate('/config')}>
          Configure Dashboard
        </Button>
      </Box>
      <EmptyState
        title="No Custom Dashboard Configured"
        message="Create a custom dashboard with your preferred widgets and layout"
        actionLabel="Configure Now"
        onAction={() => navigate('/config')}
      />
    </>
  );
}
