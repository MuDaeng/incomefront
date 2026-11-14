import { Button, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { koKR as pickersKoKR } from '@mui/x-date-pickers/locales';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'dayjs/locale/ko';
import { useState } from 'react';
import {
  BrowserRouter,
  Link as RouterLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { ApiError } from './api/client';
import { AuthProvider, CALLBACK_PATH, useAuth } from './auth/AuthProvider';
import { EmptyState, Loading } from './components/common';
import { Layout } from './components/Layout';
import { NotifierProvider } from './components/Notifier';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { DividendsPage } from './pages/DividendsPage';
import { LoginPage } from './pages/LoginPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { SecurityDetailPage } from './pages/SecurityDetailPage';
import { theme } from './theme';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        // 4xx(검증 오류, 인증 만료 등)는 재시도해도 같은 결과
        retry: (count, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      },
    },
  });

function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Loading minHeight={400} />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function NotFound() {
  return (
    <EmptyState
      title="페이지를 찾을 수 없어요"
      action={
        <Button component={RouterLink} to="/" variant="contained">
          통합잔고로
        </Button>
      }
    />
  );
}

export default function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="ko"
        localeText={pickersKoKR.components.MuiLocalizationProvider.defaultProps.localeText}
      >
        <QueryClientProvider client={queryClient}>
          <NotifierProvider>
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path={CALLBACK_PATH} element={<AuthCallbackPage />} />
                  <Route element={<RequireAuth />}>
                    <Route element={<Layout />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="securities/:securityId" element={<SecurityDetailPage />} />
                      <Route path="dividends" element={<DividendsPage />} />
                      <Route path="returns" element={<ReturnsPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Route>
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </NotifierProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
