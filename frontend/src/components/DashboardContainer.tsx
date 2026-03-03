import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Menu as MenuIcon, Dashboard, Assessment, Settings, Brightness4, Brightness7 } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

const DRAWER_WIDTH = 240;

export function DashboardContainer() {
  const navigate = useNavigate();
  const { theme, sidebarOpen, setTheme, toggleSidebar } = useUIStore();
  useRealTimeUpdates({ enabled: true });

  const menuItems = [
    { label: 'Developer', icon: <Dashboard />, path: '/dashboard/developer' },
    { label: 'Manager', icon: <Dashboard />, path: '/dashboard/manager' },
    { label: 'Executive', icon: <Dashboard />, path: '/dashboard/executive' },
    { label: 'Reports', icon: <Assessment />, path: '/reports' },
    { label: 'Configuration', icon: <Settings />, path: '/config' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AIDLC Dashboard
          </Typography>
          <IconButton color="inherit" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` },
          ml: { sm: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: (theme) =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
