import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import Add from '@mui/icons-material/Add';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import Logout from '@mui/icons-material/Logout';
import Menu from '@mui/icons-material/Menu';
import PaidOutlined from '@mui/icons-material/PaidOutlined';
import ShowChart from '@mui/icons-material/ShowChart';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useColorScheme,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { RegisterPurchaseDialog } from './RegisterPurchaseDialog';
import type { SecurityOption } from './SecuritySearch';

const DRAWER_WIDTH = 232;

const NAV = [
  { to: '/', label: '통합잔고', icon: <AccountBalanceWalletOutlined /> },
  { to: '/dividends', label: '배당금', icon: <PaidOutlined /> },
  { to: '/returns', label: '기간 수익률', icon: <ShowChart /> },
];

interface LayoutContext {
  openRegister: (security?: SecurityOption) => void;
}

export const useLayout = () => useOutletContext<LayoutContext>();

export function Layout() {
  const { logout, user } = useAuth();
  const { mode, systemMode, setMode } = useColorScheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [register, setRegister] = useState<{ open: boolean; security: SecurityOption | null }>({
    open: false,
    security: null,
  });

  const openRegister = useCallback(
    (security?: SecurityOption) => setRegister({ open: true, security: security ?? null }),
    [],
  );
  const context = useMemo<LayoutContext>(() => ({ openRegister }), [openRegister]);

  const resolvedMode = mode === 'system' ? systemMode : mode;

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          ₩
        </Box>
        <Typography variant="h6" sx={{ fontSize: 18 }}>
          배당인컴
        </Typography>
      </Toolbar>
      <List sx={{ px: 1.5 }}>
        {NAV.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': {
                bgcolor: 'action.selected',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setMobileOpen(false);
            openRegister();
          }}
        >
          매수 등록
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="메뉴 열기"
          >
            <Menu />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          {user && (
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              회원 #{user.id}
            </Typography>
          )}
          <Tooltip title={resolvedMode === 'dark' ? '라이트 모드' : '다크 모드'}>
            <IconButton onClick={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')}>
              {resolvedMode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>
          </Tooltip>
          <Tooltip title="로그아웃">
            <IconButton onClick={logout} aria-label="로그아웃">
              <Logout />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, px: { xs: 2, sm: 3, lg: 4 }, py: 3, maxWidth: 1400, mx: 'auto' }}
      >
        <Toolbar />
        <Outlet context={context} />
      </Box>

      <RegisterPurchaseDialog
        open={register.open}
        initialSecurity={register.security}
        onClose={() => setRegister((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
}
