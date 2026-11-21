import {
  Box,
  Card,
  CardHeader,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDividendMetrics } from '../api/queries';
import { monthlyAverage, payingCount, sortByAnnualDividend } from '../lib/dividendMetrics';
import {
  formatDate,
  formatExchangeRate,
  formatKrw,
  formatMoney,
  formatPercent,
  formatPrice,
  formatQuantity,
} from '../lib/format';
import { securityDetailPath } from '../lib/account';
import { EmptyState, ErrorAlert, KeyValue, Loading, ProfitText, StatCard } from './common';
import { CurrencyChip, SymbolChip } from './SecuritySearch';

/**
 * 현재 보유 종목의 배당 지표(세전): 예상 연배당·월평균·YOC·현재 배당률과 종목별 표.
 * 배당금 페이지의 기간 필터와 무관하게 오늘 기준이다.
 */
export function DividendMetricsSection({ accountId }: { accountId?: number }) {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDividendMetrics(accountId);
  const items = useMemo(() => sortByAnnualDividend(data?.items ?? []), [data]);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">배당 지표</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        현재 보유 수량 × 최근 12개월 주당 배당 기준 (세전)
        {data?.exchangeRate &&
          ` · USD 환율 ${formatExchangeRate(data.exchangeRate)} (${formatDate(data.exchangeRateDate)})`}
      </Typography>

      {isLoading ? (
        <Loading minHeight={160} />
      ) : error ? (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <Card>
          <EmptyState title="현재 보유 종목이 없어요" />
        </Card>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                highlight
                label="예상 연배당"
                value={formatKrw(data.total.krwAnnualDividend)}
                footer={<KeyValue label="배당 종목" value={`${payingCount(data.items)} / ${data.items.length}`} />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="월평균 예상 배당"
                value={formatKrw(monthlyAverage(data.total.krwAnnualDividend))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="매입가 대비 배당률 (YOC)"
                value={formatPercent(data.total.yieldOnCost)}
                footer={<KeyValue label="원금" value={formatKrw(data.total.krwPurchaseAmount)} />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                label="현재 배당률"
                value={formatPercent(data.total.currentYield)}
                footer={<KeyValue label="평가금액" value={formatKrw(data.total.krwEvaluationAmount)} />}
              />
            </Grid>
          </Grid>

          <Card>
            <CardHeader title="종목별 배당 지표" slotProps={{ title: { variant: 'h6' } }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>종목</TableCell>
                    <TableCell align="right">보유 수량</TableCell>
                    <TableCell align="right">최근 12개월 주당 배당</TableCell>
                    <TableCell align="right">예상 연배당</TableCell>
                    <TableCell align="right">YOC</TableCell>
                    <TableCell align="right">현재 배당률</TableCell>
                    <TableCell align="right">배당 성장률</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
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
                      <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                      <TableCell align="right">
                        {formatPrice(item.trailingPerShare, item.currency)}
                        <Typography variant="caption" color="text.secondary" component="div">
                          {item.paymentCount}회 지급
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatKrw(item.krwAnnualDividend)}
                        {item.currency === 'USD' && (
                          <Typography variant="caption" color="text.secondary" component="div">
                            {formatMoney(item.annualDividend, item.currency)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{formatPercent(item.yieldOnCost)}</TableCell>
                      <TableCell align="right">{formatPercent(item.currentYield)}</TableCell>
                      <TableCell align="right">
                        <ProfitText value={item.growthRate} />
                        {item.growthBasis === 'PER_PAYMENT' && (
                          <Tooltip title="상장 1년 미만이라 직전 12개월 지급 횟수가 적어, 회당 평균 배당으로 비교했어요">
                            <Typography variant="caption" color="text.secondary" component="div">
                              회당 평균
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );
}
