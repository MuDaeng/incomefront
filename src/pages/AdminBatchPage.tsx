import {
  Box,
  Card,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useBatchHistories } from '../api/queries';
import type { BatchHistoryItem, BatchStatus } from '../api/types';
import { EmptyState, ErrorAlert, Loading, PageHeader } from '../components/common';
import { formatDateTime, formatDuration } from '../lib/format';

/** 백엔드 apps/batch/src/scheduler/batch.jobs.ts의 잡 이름과 맞춘다 */
const JOBS = [
  { value: 'exchange-rates', label: '환율 (exchange-rates)' },
  { value: 'domestic-securities', label: '국내 종목 (domestic-securities)' },
  { value: 'overseas-securities', label: '해외 종목 (overseas-securities)' },
  { value: 'us-daily-prices', label: '미국 시세 (us-daily-prices)' },
  { value: 'expired-tokens', label: '만료 세션 정리 (expired-tokens)' },
];

const STATUSES: { value: BatchStatus; label: string; color: 'info' | 'success' | 'error' }[] = [
  { value: 'RUNNING', label: '실행 중', color: 'info' },
  { value: 'SUCCESS', label: '성공', color: 'success' },
  { value: 'FAILED', label: '실패', color: 'error' },
];

const LIMITS = [20, 50, 100];

/** 결과(JSON 또는 에러 메시지)는 앞부분만 보여 주고, 전체는 Tooltip으로 */
const RESULT_PREVIEW = 80;

export function AdminBatchPage() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<BatchStatus | ''>('');
  const [limit, setLimit] = useState(20);
  const { data, isLoading, error, refetch, isFetching } = useBatchHistories({
    name: name || undefined,
    status: status || undefined,
    limit,
  });

  return (
    <>
      <PageHeader
        title="배치 이력"
        subtitle="배치 잡 실행 기록 · 시작 시각 최신순 · 실행 중으로 남은 기록은 실행 중이거나 중간에 죽은 것"
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <TextField
              select
              size="small"
              label="잡"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ width: 230 }}
            >
              <MenuItem value="">전체 잡</MenuItem>
              {JOBS.map((j) => (
                <MenuItem key={j.value} value={j.value}>
                  {j.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="상태"
              value={status}
              onChange={(e) => setStatus(e.target.value as BatchStatus | '')}
              sx={{ width: 120 }}
            >
              <MenuItem value="">전체</MenuItem>
              {STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="건수"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              sx={{ width: 90 }}
            >
              {LIMITS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}건
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <Card>
          <EmptyState title="실행 기록이 없습니다." />
        </Card>
      ) : (
        <Card sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>잡</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>시작</TableCell>
                  <TableCell align="right">소요 시간</TableCell>
                  <TableCell>결과</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <BatchRow key={item.id} item={item} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </>
  );
}

function BatchRow({ item }: { item: BatchHistoryItem }) {
  const status = STATUSES.find((s) => s.value === item.status);
  const result = item.result ?? '';
  const preview = result.length > RESULT_PREVIEW ? `${result.slice(0, RESULT_PREVIEW)}…` : result;
  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{item.name}</TableCell>
      <TableCell>
        <Chip
          size="small"
          variant="outlined"
          label={status?.label ?? item.status}
          color={status?.color ?? 'default'}
          sx={{ height: 22, fontSize: 12 }}
        />
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {formatDateTime(item.startedAt)}
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {formatDuration(item.durationMs)}
      </TableCell>
      <TableCell sx={{ maxWidth: 420 }}>
        {result ? (
          <Tooltip
            title={
              <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11 }}>
                {result}
              </Box>
            }
          >
            <Typography
              variant="caption"
              color={item.status === 'FAILED' ? 'error' : 'text.secondary'}
              sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
            >
              {preview}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="caption" color="text.secondary">
            -
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
}
