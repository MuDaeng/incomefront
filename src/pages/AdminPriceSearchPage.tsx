import Refresh from '@mui/icons-material/Refresh';
import {
  Button,
  Card,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { usePriceSearches } from '../api/queries';
import type { PriceSearchItem } from '../api/types';
import { EmptyState, ErrorAlert, Loading, PageHeader } from '../components/common';
import { formatDate, formatDateTime } from '../lib/format';
import { filterPriceSearches } from '../lib/priceSearches';

const numericSx = { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } as const;

/**
 * 관리자: 국내 종목 조회 때 KIS로 하루치 시세를 보충한 기록 (GET /admin/security-searches/price).
 * 마지막 확인일 최신순. 백엔드가 전체를 한 번에 주므로 검색은 화면에서만 한다
 */
export function AdminPriceSearchPage() {
  const [keyword, setKeyword] = useState('');
  const { data, isLoading, error, refetch, isFetching } = usePriceSearches();
  const rows = useMemo(() => filterPriceSearches(data ?? [], keyword), [data, keyword]);

  return (
    <>
      <PageHeader
        title="시세 조회 이력"
        subtitle="국내 종목 조회 때 일별 시세를 마지막으로 확인한 날짜 · 최근 확인순 · 15:30 전에는 전날, 이후에는 당일 시세를 확인"
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <TextField
              size="small"
              label="종목 검색"
              placeholder="종목명·심볼"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{ width: 200 }}
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              새로고침
            </Button>
          </Stack>
        }
      />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <Card>
          <EmptyState title="시세 조회 기록이 없습니다." />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title="검색 결과가 없습니다." />
        </Card>
      ) : (
        <Card sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pt: 1.5 }}>
            {keyword.trim() ? `${rows.length} / ${data.length}종목` : `${data.length}종목`}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>종목</TableCell>
                  <TableCell>마지막 확인일</TableCell>
                  <TableCell>최초 기록</TableCell>
                  <TableCell>수정 시각</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((item) => (
                  <PriceSearchRow key={item.securityId} item={item} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </>
  );
}

function PriceSearchRow({ item }: { item: PriceSearchItem }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {item.name ?? '(종목 정보 없음)'}
        </Typography>
        {item.symbol && (
          <Typography variant="caption" color="text.secondary">
            {item.symbol}
          </Typography>
        )}
      </TableCell>
      <TableCell sx={numericSx}>{formatDate(item.lastSearchDate)}</TableCell>
      <TableCell sx={numericSx}>{formatDateTime(item.createdAt)}</TableCell>
      <TableCell sx={numericSx}>{formatDateTime(item.updatedAt)}</TableCell>
    </TableRow>
  );
}
