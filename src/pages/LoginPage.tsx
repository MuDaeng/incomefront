import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { GOOGLE_LOGIN_URL } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { Loading } from '../components/common';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const FEATURES = [
  ['통합잔고', '국내·미국 주식을 원화로 한눈에'],
  ['배당 캘린더', '월별 배당금과 지급 예정까지'],
  ['총수익률', '평가손익 + 배당금으로 진짜 수익 확인'],
];

export function LoginPage() {
  const { status, autoLoginError } = useAuth();
  if (status === 'loading') return <Loading minHeight={400} />;
  if (status === 'authenticated') return <Navigate to="/" replace />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 24,
              mb: 3,
            }}
          >
            ₩
          </Box>
          <Typography variant="h4" component="h1">
            배당인컴
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            매수 내역만 등록하면 배당금과 수익률을 자동으로 계산해 드려요.
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 4 }}>
            {FEATURES.map(([title, desc]) => (
              <Stack key={title} direction="row" spacing={1.5} sx={{ alignItems: 'baseline' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 72, color: 'primary.main' }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {desc}
                </Typography>
              </Stack>
            ))}
          </Stack>
          {autoLoginError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {autoLoginError}
            </Alert>
          )}
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="inherit"
            href={GOOGLE_LOGIN_URL}
            startIcon={<GoogleIcon />}
            sx={{ py: 1.25, borderColor: 'divider' }}
          >
            Google 계정으로 계속하기
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
