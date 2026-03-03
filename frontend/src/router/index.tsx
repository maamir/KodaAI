import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardContainer } from '@/components/DashboardContainer';
import { DeveloperDashboard } from '@/components/views/DeveloperDashboard';
import { ManagerDashboard } from '@/components/views/ManagerDashboard';
import { ExecutiveDashboard } from '@/components/views/ExecutiveDashboard';
import { CustomDashboard } from '@/components/views/CustomDashboard';
import { ReportGeneratorUI } from '@/components/reports/ReportGeneratorUI';
import { ReportListTable } from '@/components/reports/ReportListTable';
import { DashboardConfigUI } from '@/components/config/DashboardConfigUI';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardContainer />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard/developer" replace />,
      },
      {
        path: 'dashboard',
        children: [
          {
            path: 'developer',
            element: <DeveloperDashboard />,
          },
          {
            path: 'manager',
            element: <ManagerDashboard />,
          },
          {
            path: 'executive',
            element: <ExecutiveDashboard />,
          },
          {
            path: 'custom',
            element: <CustomDashboard />,
          },
        ],
      },
      {
        path: 'reports',
        children: [
          {
            index: true,
            element: <ReportListTable />,
          },
          {
            path: 'generate',
            element: <ReportGeneratorUI />,
          },
        ],
      },
      {
        path: 'config',
        element: <DashboardConfigUI />,
      },
    ],
  },
]);
