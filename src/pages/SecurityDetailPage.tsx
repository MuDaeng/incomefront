import Add from '@mui/icons-material/Add';
import ArrowBack from '@mui/icons-material/ArrowBack';
import DeleteOutline from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';
import { type ReactNode, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  useDailyPrices,
  useDividendMetrics,
  useMonthlyBalance,
  usePurchases,
  useAccounts,
  useSecurityDividends,
} from '../api/queries';
import type { Account, PurchaseHistoryItem, SecurityInfo } from '../api/types';
import { AccountSelect } from '../components/AccountSelect';
import {
  EmptyState,
  ErrorAlert,
  Loading,
  ProfitText,
  StatCard,
  staticFocusSx,
} from '../components/common';
import { useLayout } from '../components/Layout';
import { DeletePurchaseDialog } from '../components/DeletePurchaseDialog';
import { EditExchangeRateDialog } from '../components/EditExchangeRateDialog';
import { MovePurchaseAccountDialog } from '../components/MovePurchaseAccountDialog';
import { CurrencyChip, SymbolChip } from '../components/SecuritySearch';
import { AccountAmountChips, AccountChip } from '../components/SecurityCompanySelect';
import { SellDialog } from '../components/SellDialog';
import { BulkSellDialog } from '../components/BulkSellDialog';
import { CandleChart } from '../components/CandleChart';
import { type CandleInterval, toCandles, weekStart } from '../lib/candles';
import { KRW_COLOR, USD_COLOR } from '../lib/chart';
import { fillDividendMonths, monthTickLabel, trailingYearDividend } from '../lib/dividends';
import { accountLabel } from '../lib/account';
import { findMetricsItem, growthBasisNote } from '../lib/dividendMetrics';
import { dividendRecoveryItems, formatRecoveryPeriod, recoveryMonth } from '../lib/dividendRecovery';
import { RECOVERY_NOTE } from '../components/DividendRecoveryCard';
import { useAccountParam } from '../lib/useAccountParam';
import {
  formatDate,
  formatExchangeRate,
  formatMoney,
  formatKrw,
  formatMonth,
  formatPercent,
  formatPrice,
  formatQuantity,
  formatRate,
  toNumber,
} from '../lib/format';

export function SecurityDetailPage() {
  const { securityId = '' } = useParams();
  const { openRegister } = useLayout();
  // 계좌 필터는 URL 쿼리(?accountId=)에 둔다 (통합잔고에서 넘어올 때도 유지)
  const [accountId, setAccountId] = useAccountParam();
  const { data, isLoading, error, refetch } = usePurchases(securityId, accountId);
  const { data: accounts } = useAccounts();
  const [selling, setSelling] = useState<PurchaseHistoryItem | null>(null);
  const [bulkSelling, setBulkSelling] = useState(false);
  const [deleting, setDeleting] = useState<PurchaseHistoryItem | null>(null);
  const [editingRate, setEditingRate] = useState<PurchaseHistoryItem | null>(null);
  const [movingAccount, setMovingAccount] = useState<PurchaseHistoryItem | null>(null);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    const held = items.filter((i) => !i.saleDate);
    const quantity = held.reduce((s, i) => s + toNumber(i.amount), 0);
    const cost = held.reduce((s, i) => s + toNumber(i.amount) * toNumber(i.price), 0);
    return {
      quantity,
      cost,
      average: quantity > 0 ? cost / quantity : null,
      heldCount: held.length,
      soldCount: items.length - held.length,
    };
  }, [data]);

  // 평균 매수가 카드의 현재가: 최근 한 달 시세의 마지막 종가 (날짜는 일 단위로 고정해 캐시 키를 유지)
  const recentFrom = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
  const { data: recentPrices } = useDailyPrices(securityId, recentFrom);
  const lastPrice = recentPrices?.prices[recentPrices.prices.length - 1];
  const currentPrice = lastPrice ? toNumber(lastPrice.closingPrice) : null;

  if (isLoading) return <Loading />;
  if (error) return <ErrorAlert error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const { security } = data;
  // 계좌 필터 중에는 다른 계좌 매수분이 남아 있을 수 있어 "마지막 매수분"으로 보지 않는다
  const isLastLot = !accountId && data.items.length === 1;
  const selectedAccount = accounts?.find((a) => a.id === accountId);

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton component={RouterLink} to="/" aria-label="통합잔고로">
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" component="h1" noWrap>
              {security.name}
            </Typography>
            <CurrencyChip currency={security.currency} />
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            <SymbolChip symbol={security.symbol} />
          </Box>
        </Box>
        {/* 매수 등록 창이 닫히면 포커스가 이 버튼으로 돌아오므로 포커스 펄스 애니메이션을 끈다 */}
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openRegister(security, accountId)}
          disableFocusRipple
          sx={staticFocusSx}
        >
          추가 매수
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setBulkSelling(true)}
          disabled={data.accountAmounts.length === 0}
        >
          일괄매도
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="보유 수량"
            value={`${formatQuantity(data.amount)}주`}
            sub={
              <AccountAmountChips
                accountAmounts={data.accountAmounts}
                accounts={accounts}
                formatAmount={formatQuantity}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="평균 매수가"
            value={stats.average === null ? '-' : formatPrice(stats.average, security.currency)}
            sub={
              currentPrice !== null && (
                <Typography variant="caption" color="text.secondary">
                  현재가 {formatPrice(currentPrice, security.currency)}
                  {stats.average !== null && stats.average > 0 && (
                    <>
                      {' '}
                      <ProfitText value={(currentPrice / stats.average - 1) * 100} variant="caption">
                        ({formatRate((currentPrice / stats.average - 1) * 100)})
                      </ProfitText>
                    </>
                  )}
                </Typography>
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="보유 원금" value={formatMoney(stats.cost, security.currency)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="매수 / 매도 건" value={`${stats.heldCount} / ${stats.soldCount}`} />
        </Grid>
      </Grid>

      <PriceChartCard security={security} average={stats.average} />

      <DividendHistoryCard security={security} accountId={accountId} />

      <Card sx={{ mt: 2 }}>
        <CardHeader
          title="매수 내역"
          slotProps={{ title: { variant: 'h6' } }}
          action={
            <AccountSelect
              allowAll
              size="small"
              width={210}
              value={accountId ?? null}
              onChange={setAccountId}
              accounts={accounts}
            />
          }
          sx={{ flexWrap: 'wrap', gap: 1 }}
        />
        {data.items.length === 0 ? (
          <EmptyState
            title={
              accountId
                ? `${selectedAccount ? accountLabel(selectedAccount, accounts) : '이 계좌'} 매수 내역이 없습니다.`
                : '매수 내역이 없습니다.'
            }
          />
        ) : (
          <PurchaseTable
            security={security}
            items={data.items}
            onSell={setSelling}
            onDelete={setDeleting}
            onEditRate={setEditingRate}
            onMoveAccount={setMovingAccount}
            accounts={accounts}
          />
        )}
      </Card>

      <SellDialog security={security} purchase={selling} onClose={() => setSelling(null)} />
      <BulkSellDialog
        open={bulkSelling}
        security={security}
        accountAmounts={data.accountAmounts}
        accounts={accounts}
        initialAccountId={accountId}
        onClose={() => setBulkSelling(false)}
      />
      <MovePurchaseAccountDialog
        security={security}
        purchase={movingAccount}
        onClose={() => setMovingAccount(null)}
      />
      <EditExchangeRateDialog
        security={security}
        purchase={editingRate}
        onClose={() => setEditingRate(null)}
      />
      <DeletePurchaseDialog
        security={security}
        purchase={deleting}
        isLast={isLastLot}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          // 마지막 매수분을 지우면 보유 종목에서 빠지므로 통합잔고로 돌아간다
          if (isLastLot) navigate('/');
        }}
      />
    </>
  );
}

function PurchaseTable({
  security,
  items,
  onSell,
  onDelete,
  onEditRate,
  onMoveAccount,
  accounts,
}: {
  security: SecurityInfo;
  items: PurchaseHistoryItem[];
  onSell: (item: PurchaseHistoryItem) => void;
  onDelete: (item: PurchaseHistoryItem) => void;
  onEditRate: (item: PurchaseHistoryItem) => void;
  onMoveAccount: (item: PurchaseHistoryItem) => void;
  accounts?: readonly Account[];
}) {
  const isUsd = security.currency === 'USD';
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>매수일</TableCell>
            <TableCell>계좌</TableCell>
            <TableCell align="right">수량</TableCell>
            <TableCell align="right">매수가</TableCell>
            <TableCell align="right">매수금액</TableCell>
            {isUsd && <TableCell align="right">구매 환율</TableCell>}
            <TableCell>상태</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`${item.purchaseDate}-${item.sequence}`} hover>
              <TableCell>
                {formatDate(item.purchaseDate)}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                  #{item.sequence}
                </Typography>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {/* 표에서는 짧은 이름(토스, 토스 ISA 등), 마우스를 올리면 정식 이름 */}
                <AccountChip account={item} accounts={accounts} />
                <Tooltip title="계좌 이동">
                  <IconButton
                    size="small"
                    aria-label="계좌 이동"
                    onClick={() => onMoveAccount(item)}
                    sx={{ ml: 0.25 }}
                  >
                    <EditOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell align="right">{formatQuantity(item.amount)}</TableCell>
              <TableCell align="right">{formatPrice(item.price, security.currency)}</TableCell>
              <TableCell align="right">
                {formatMoney(toNumber(item.amount) * toNumber(item.price), security.currency)}
              </TableCell>
              {isUsd && (
                <TableCell align="right">
                  {item.exchangeRate ? (
                    <Tooltip
                      title={
                        // exchangeRateDate가 null이면 매수 시 저장한 환율, 있으면 그날 종가 환율로 대체한 값
                        item.exchangeRateDate
                          ? `${formatDate(item.exchangeRateDate)} 종가 환율 (저장된 구매 환율 없음)`
                          : '매수 시 저장한 구매 환율'
                      }
                    >
                      <span>{formatExchangeRate(item.exchangeRate)}</span>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                  <Tooltip title="구매 환율 수정">
                    <IconButton
                      size="small"
                      aria-label="구매 환율 수정"
                      onClick={() => onEditRate(item)}
                      sx={{ ml: 0.25 }}
                    >
                      <EditOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
              <TableCell>
                {item.saleDate ? (
                  <Chip size="small" label={`${formatDate(item.saleDate)} 매도`} />
                ) : (
                  <Chip size="small" color="primary" variant="outlined" label="보유 중" />
                )}
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {!item.saleDate && (
                  <Button size="small" color="error" onClick={() => onSell(item)}>
                    매도
                  </Button>
                )}
                <Tooltip title="매수 내역 삭제">
                  <IconButton
                    size="small"
                    aria-label="매수 내역 삭제"
                    onClick={() => onDelete(item)}
                    sx={{ ml: 0.5 }}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const RANGES = [
  { key: '1M', label: '1개월', months: 1 },
  { key: '3M', label: '3개월', months: 3 },
  { key: '6M', label: '6개월', months: 6 },
  { key: '1Y', label: '1년', months: 12 },
  { key: 'ALL', label: '전체', months: null },
] as const;

const INTERVALS: { key: CandleInterval; label: string }[] = [
  { key: 'day', label: '일봉' },
  { key: 'week', label: '주봉' },
];

/** 차트에 그리는 최대 개월 수 (KRW 배당은 2020년부터 쌓인다) */
const DIVIDEND_CHART_MONTHS = 36;

function DividendHistoryCard({
  security,
  accountId,
}: {
  security: SecurityInfo;
  accountId?: number;
}) {
  const { data, isLoading, error } = useSecurityDividends(security.id);
  // 보유 기준 지표 (현재 보유하지 않으면 없음)
  const { data: metricsData } = useDividendMetrics(accountId);
  const metrics = findMetricsItem(metricsData, security.id);
  // 배당으로 원금 회복 예상 (보유 중이고 평가금액 + 누적배당금 < 원금일 때만)
  const today = dayjs().format('YYYY-MM-DD');
  const thisMonth = today.slice(0, 7);
  const { data: monthlyData } = useMonthlyBalance(thisMonth, thisMonth, !!metrics, accountId);
  const recovery = useMemo(() => {
    if (!metrics) return null;
    const monthItems = monthlyData?.months[monthlyData.months.length - 1]?.items ?? [];
    return (
      dividendRecoveryItems(
        monthItems.filter((i) => i.securityId === security.id),
        [metrics],
      )[0] ?? null
    );
  }, [monthlyData, metrics, security.id]);
  const months = useMemo(() => data?.months ?? [], [data]);
  const chartMonths = useMemo(() => fillDividendMonths(months, DIVIDEND_CHART_MONTHS), [months]);
  const trailing = useMemo(
    () => trailingYearDividend(months, dayjs().format('YYYY-MM-DD')),
    [months],
  );

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader
        title="월별 배당금 (1주당)"
        slotProps={{ title: { variant: 'h6' } }}
        subheader={
          months.length > 0
            ? `최근 12개월 ${formatPrice(trailing.amount, security.currency)} · ${trailing.count}회 지급`
            : undefined
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {metrics && (
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricBox
                label="예상 연배당 (세전)"
                value={formatKrw(metrics.krwAnnualDividend)}
                sub={
                  security.currency === 'USD'
                    ? formatMoney(metrics.annualDividend, security.currency)
                    : `월 ${formatKrw(toNumber(metrics.krwAnnualDividend) / 12)}`
                }
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricBox label="매입가 대비 (YOC)" value={formatPercent(metrics.yieldOnCost)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricBox
                label="현재 배당률"
                value={formatPercent(metrics.currentYield)}
                sub={metrics.closingPrice ? `종가 ${formatPrice(metrics.closingPrice, security.currency)}` : undefined}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricBox
                label="배당 성장률 (전년 12개월 대비)"
                value={<ProfitText value={metrics.growthRate} variant="h6" fontWeight={700} />}
                sub={growthBasisNote(metrics, security.currency)}
              />
            </Grid>
            {recovery && (
              <Grid size={12}>
                <Tooltip title={RECOVERY_NOTE}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">
                      배당으로 원금 회복 (평가금액 + 누적 배당금 {formatKrw(recovery.totalAmount)} / 원금{' '}
                      {formatKrw(recovery.purchaseAmount)})
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      손실 <ProfitText value={-recovery.loss}>{formatKrw(-recovery.loss)}</ProfitText>
                      {' · '}
                      {recovery.months === null
                        ? '최근 12개월 배당이 없어 배당으로 회복할 수 없어요'
                        : `지금 배당이면 ${formatRecoveryPeriod(recovery.months)} 뒤 (${formatMonth(
                            recoveryMonth(recovery.months, today) ?? '',
                          )}경) 회복`}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
            )}
          </Grid>
        )}
        {isLoading ? (
          <Loading minHeight={240} />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : chartMonths.length === 0 ? (
          <EmptyState title="배당 내역이 없습니다." />
        ) : (
          <BarChart
            height={260}
            grid={{ horizontal: true }}
            xAxis={[
              {
                scaleType: 'band',
                data: chartMonths.map((m) => m.month),
                valueFormatter: (m: string, ctx) =>
                  ctx.location === 'tick' ? monthTickLabel(m) : formatMonth(m),
              },
            ]}
            yAxis={[{ width: 64, valueFormatter: (v: number) => formatPrice(v, security.currency) }]}
            series={[
              {
                data: chartMonths.map((m) => m.amount),
                label: '1주당 배당금',
                color: security.currency === 'KRW' ? KRW_COLOR : USD_COLOR,
                valueFormatter: (v, { dataIndex }) => {
                  const count = chartMonths[dataIndex]?.count ?? 0;
                  const amount = formatPrice(v ?? 0, security.currency);
                  return count > 1 ? `${amount} (${count}회)` : amount;
                },
              },
            ]}
            hideLegend
            borderRadius={4}
          />
        )}
      </CardContent>
    </Card>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', height: '100%' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Box>
  );
}

function PriceChartCard({ security, average }: { security: SecurityInfo; average: number | null }) {
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]['key']>('6M');
  const [interval, setCandleInterval] = useState<CandleInterval>('day');
  const months = RANGES.find((r) => r.key === rangeKey)?.months ?? null;
  // 날짜가 바뀌어도 캐시 키가 매 렌더마다 바뀌지 않도록 일 단위로 고정
  const rawFrom = months ? dayjs().subtract(months, 'month').format('YYYY-MM-DD') : undefined;
  // 주봉은 첫 주가 잘리지 않도록 그 주 월요일부터 받는다
  const from = rawFrom && interval === 'week' ? weekStart(rawFrom) : rawFrom;
  const { data, isLoading, error } = useDailyPrices(security.id, from);

  const prices = data?.prices ?? [];
  const candles = useMemo(() => toCandles(data?.prices ?? [], interval), [data, interval]);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const change = first && last ? toNumber(last.closingPrice) - toNumber(first.closingPrice) : null;
  const changeRate = change !== null && first ? (change / toNumber(first.closingPrice)) * 100 : null;

  return (
    <Card>
      <CardHeader
        title="시세"
        slotProps={{ title: { variant: 'h6' } }}
        subheader={
          last ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 0.5 }}>
              <Typography variant="h6" component="span" color="text.primary">
                {formatPrice(last.closingPrice, security.currency)}
              </Typography>
              {changeRate !== null && (
                <ProfitText value={changeRate}>
                  {formatRate(changeRate)} (기간)
                </ProfitText>
              )}
              <Typography variant="caption" color="text.secondary">
                {formatDate(last.date)} 종가
              </Typography>
            </Stack>
          ) : undefined
        }
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={interval}
              onChange={(_, v) => v && setCandleInterval(v)}
              aria-label="봉 단위"
            >
              {INTERVALS.map((i) => (
                <ToggleButton key={i.key} value={i.key}>
                  {i.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={rangeKey}
              onChange={(_, v) => v && setRangeKey(v)}
              aria-label="기간"
            >
              {RANGES.map((r) => (
                <ToggleButton key={r.key} value={r.key}>
                  {r.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        }
        sx={{ flexWrap: 'wrap', gap: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {isLoading ? (
          <Loading minHeight={280} />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : candles.length === 0 ? (
          <EmptyState title="시세 데이터가 없습니다." />
        ) : (
          <CandleChart
            candles={candles}
            currency={security.currency}
            interval={interval}
            average={average}
          />
        )}
      </CardContent>
    </Card>
  );
}
