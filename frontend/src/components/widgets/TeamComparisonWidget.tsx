import { Card, CardContent, CardHeader, Typography, Box, LinearProgress } from '@mui/material';

interface TeamMember {
  name: string;
  value: number;
  maxValue: number;
  color?: string;
}

interface TeamComparisonWidgetProps {
  title?: string;
  members: TeamMember[];
  unit?: string;
}

export function TeamComparisonWidget({ title, members, unit = '' }: TeamComparisonWidgetProps) {
  return (
    <Card>
      {title && (
        <CardHeader title={<Typography variant="h6">{title}</Typography>} />
      )}
      <CardContent>
        {members.map((member, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="body2">{member.name}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {member.value}{unit}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(member.value / member.maxValue) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: member.color || 'primary.main',
                },
              }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
