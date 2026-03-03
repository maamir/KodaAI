import { useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGenerateReport } from '@/hooks/useReports';
import { ReportType, ReportFormat } from '@/types/entities';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function ReportGeneratorUI() {
  const navigate = useNavigate();
  const { mutate: generateReport, isPending } = useGenerateReport();
  const [reportType] = useState<ReportType>(ReportType.DEVELOPER_PERSONAL);
  const [format] = useState<ReportFormat>(ReportFormat.PDF);

  const handleGenerate = () => {
    generateReport(
      {
        reportType,
        format,
        title: 'Sample Report',
        filters: {},
      },
      {
        onSuccess: () => {
          navigate('/reports');
        },
      }
    );
  };

  if (isPending) return <LoadingSpinner message="Generating report..." />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Generate Report
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" gutterBottom>
          Report generation UI coming soon...
        </Typography>
        <Button variant="contained" onClick={handleGenerate} sx={{ mt: 2 }}>
          Generate Sample Report
        </Button>
      </Paper>
    </Box>
  );
}
