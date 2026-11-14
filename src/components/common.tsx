import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { formatRate, profitColor } from '../lib/format';

const FOCUS_OVERLAY = 'color-mix(in srgb, currentColor 30%, transparent)';

/**
 * 버튼에 `disableFocusRipple`과 함께 쓴다.
 * 키보드 포커스 때 펄스 애니메이션 대신, 같은 색(MUI 포커스 ripple: 글자색 30%)을 고정으로 덮는다.
 */
export const staticFocusSx = {
  '&.Mui-focusVisible': {
    backgroundImage: `linear-gradient(${FOCUS_OVERLAY}, ${FOCUS_OVERLAY})`,
  },
} as const;

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}
    >
      <Box>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

/** 수익(빨강)/손실(파랑) 색상 텍스트 */
export function ProfitText({
  value,
  children,
  variant = 'body2',
  fontWeight = 600,
}: {
  value: string | number | null | undefined;
  children?: ReactNode;
  variant?: 'body2' | 'body1' | 'h6' | 'h5' | 'h4' | 'caption' | 'subtitle1';
  fontWeight?: number;
}) {
  return (
    <Typography
      component="span"
      variant={variant}
      sx={{ color: profitColor(value), fontWeight, fontVariantNumeric: 'tabular-nums' }}
    >
      {children ?? formatRate(value)}
    </Typography>
  );
}

export function StatCard({
  label,
  value,
  sub,
  footer,
  highlight,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  footer?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card
      sx={{
        height: '100%',
        ...(highlight && {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderColor: 'primary.main',
        }),
      }}
    >
      <CardContent>
        <Typography
          variant="body2"
          sx={{ opacity: highlight ? 0.85 : 1, color: highlight ? 'inherit' : 'text.secondary' }}
        >
          {label}
        </Typography>
        <Typography
          variant="h5"
          sx={{ mt: 1, fontVariantNumeric: 'tabular-nums', wordBreak: 'keep-all' }}
        >
          {value}
        </Typography>
        {sub && <Box sx={{ mt: 0.5 }}>{sub}</Box>}
        {footer && (
          <Box
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: 1,
              borderColor: highlight ? 'rgba(255,255,255,0.25)' : 'divider',
            }}
          >
            {footer}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export function KeyValue({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 0.25 }}>
      <Typography variant="body2" sx={{ opacity: 0.75 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function Loading({ minHeight = 240 }: { minHeight?: number }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight }}>
      <CircularProgress />
    </Box>
  );
}

export function ErrorAlert({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
  return (
    <Alert
      severity="error"
      sx={{ whiteSpace: 'pre-line' }}
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            다시 시도
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 8, px: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );
}
