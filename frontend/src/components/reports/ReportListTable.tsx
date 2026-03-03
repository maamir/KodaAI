import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useListReports } from '@/hooks/useReports';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTableWidget } from '@/components/widgets/DataTableWidget';

export function ReportListTable() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useListReports();

  if (isLoading) return <LoadingSpinner message="Loading reports..." />;
  if (error) return <ErrorAlert message="Failed to load reports" onRetry={() => refetch()} />;

  const reports = data?.data || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reports</Typography>
        <Button variant="contained" onClick={() => navigate('/reports/generate')}>
          Generate Report
        </Button>
      </Box>

      {reports.length === 0 ? (
        <EmptyState
          title="No Reports Yet"
          message="Generate your first report to see it here"
          actionLabel="Generate Report"
          onAction={() => navigate('/reports/generate')}
        />
      ) : (
        <DataTableWidget
          columns={[
            { id: 'title', label: 'Title', sortable: true },
            { id: 'reportType', label: 'Type', sortable: true },
            { id: 'format', label: 'Format', sortable: true },
            { id: 'status', label: 'Status', sortable: true },
            { id: 'createdAt', label: 'Created', sortable: true },
          ]}
          data={reports}
        />
      )}
    </Box>
  );
}
