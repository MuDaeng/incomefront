import Refresh from '@mui/icons-material/Refresh';
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useClientTokens } from '../api/queries';
import { EmptyState, ErrorAlert, Loading, PageHeader } from '../components/common';
import { clientTypeLabel, formatElapsed } from '../lib/clientTokens';
import { formatDateTime } from '../lib/format';

const numericSx = { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } as const;

/**
 * 관리자: 외부 API 토큰을 마지막으로 발급(저장)한 시각 (GET /admin/client-tokens).
 * 토큰 값은 백엔드가 내려주지 않는다
 */
export function AdminClientTokenPage() {
  const { data, isLoading, error, refetch, isFetching } = useClientTokens();
  // 경과 시간은 응답을 받은 시점 기준 (새로고침하면 다시 계산)
  const now = new Date();

  return (
    <>
      <PageHeader
        title="토큰 갱신 이력"
        subtitle="외부 API 토큰을 새로 발급해 저장한 시각 · 저장된 토큰을 재사용하는 호출에서는 바뀌지 않음"
        action={
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            새로고침
          </Button>
        }
      />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <Card>
          <EmptyState title="저장된 토큰이 없습니다." />
        </Card>
      ) : (
        <Card sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>외부 API</TableCell>
                  <TableCell>마지막 갱신 시각</TableCell>
                  <TableCell>경과</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.clientType} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {clientTypeLabel(item.clientType)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={numericSx}>{formatDateTime(item.updatedAt)}</TableCell>
                    <TableCell sx={numericSx}>{formatElapsed(item.updatedAt, now)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </>
  );
}
