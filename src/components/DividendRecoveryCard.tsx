import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonthlyBalance } from '../api/queries';
import type { DividendMetricsItem } from '../api/types';
import { securityDetailPath } from '../lib/account';
import { dividendRecoveryItems, formatRecoveryPeriod, recoveryMonth } from '../lib/dividendRecovery';
import { formatKrw, formatMonth } from '../lib/format';
import { EmptyState, ErrorAlert, Loading, ProfitText } from './common';
import { CurrencyChip, SymbolChip } from './SecuritySearch';

export const RECOVERY_NOTE =
  '현재 주가와 최근 12개월 배당(세전)이 유지된다고 가정한 추정이에요. 누적 배당금에는 이미 매도한 수량이 받은 배당도 포함돼요.';

/**
 * 평가금액 + 누적배당금이 원금보다 적은 보유 종목과, 지금 배당으로 손실을 메우기까지의 예상 기간.
 * 손실 종목이 없거나 조회에 실패하면 카드 안에 안내 문구를 보여 준다.
 */
export function DividendRecoveryCard({
  metricsItems,
  accountId,
}: {
  metricsItems: DividendMetricsItem[];
  accountId?: number;
}) {
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  const month = today.slice(0, 7);
  const { data, isLoading, error, refetch } = useMonthlyBalance(month, month, true, accountId);
  const items = useMemo(
    () => dividendRecoveryItems(data?.months[data.months.length - 1]?.items ?? [], metricsItems),
    [data, metricsItems],
  );

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader
        title="배당으로 원금 회복"
        subheader={`평가금액 + 누적 배당금이 원금보다 적은 종목 · ${RECOVERY_NOTE}`}
        slotProps={{ title: { variant: 'h6' }, subheader: { variant: 'caption' } }}
      />
      {isLoading ? (
        <Loading minHeight={120} />
      ) : error ? (
        <CardContent sx={{ pt: 0 }}>
          <ErrorAlert error={error} onRetry={() => refetch()} />
        </CardContent>
      ) : items.length === 0 ? (
        <EmptyState
          title="배당 포함 손실 중인 종목이 없어요"
          description="모든 보유 종목의 평가금액 + 누적 배당금이 원금 이상이에요."
        />
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>종목</TableCell>
                <TableCell align="right">원금</TableCell>
                <TableCell align="right">평가 + 누적 배당</TableCell>
                <TableCell align="right">손실</TableCell>
                <TableCell align="right">예상 연배당</TableCell>
                <TableCell align="right">회복 예상</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const at = recoveryMonth(item.months, today);
                return (
                  <TableRow
                    key={item.securityId}
                    hover
                    onClick={() => navigate(securityDetailPath(item.securityId, accountId))}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <CurrencyChip currency={item.currency} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 220 }} noWrap>
                            {item.name}
                          </Typography>
                          <Box sx={{ mt: 0.25 }}>
                            <SymbolChip symbol={item.symbol} />
                          </Box>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{formatKrw(item.purchaseAmount)}</TableCell>
                    <TableCell align="right">{formatKrw(item.totalAmount)}</TableCell>
                    <TableCell align="right">
                      <ProfitText value={-item.loss}>{formatKrw(-item.loss)}</ProfitText>
                    </TableCell>
                    <TableCell align="right">{formatKrw(item.krwAnnualDividend)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatRecoveryPeriod(item.months)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        {at ? `${formatMonth(at)}경` : '최근 12개월 배당 없음'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
