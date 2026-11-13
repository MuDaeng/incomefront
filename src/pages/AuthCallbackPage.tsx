import { Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { ErrorAlert, Loading } from '../components/common';

/** 백엔드 Google callback이 refresh token cookie를 심고 리다이렉트하는 화면 */
export function AuthCallbackPage() {
  const { completeLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode 이중 실행 방지
    started.current = true;
    completeLogin()
      .then(() => navigate('/', { replace: true }))
      .catch(setError);
  }, [completeLogin, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      {error ? (
        <Stack spacing={2} sx={{ maxWidth: 420, width: '100%' }}>
          <ErrorAlert error={error} />
          <Button variant="contained" onClick={() => navigate('/login', { replace: true })}>
            로그인 화면으로
          </Button>
        </Stack>
      ) : (
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <Loading minHeight={80} />
          <Typography color="text.secondary">로그인 중입니다…</Typography>
        </Stack>
      )}
    </Box>
  );
}
