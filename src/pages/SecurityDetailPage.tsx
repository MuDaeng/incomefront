import Add from '@mui/icons-material/Add';
import ArrowBack from '@mui/icons-material/ArrowBack';
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
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useDailyPrices, usePurchases } from '../api/queries';
import type { PurchaseHistoryItem, SecurityInfo } from '../api/types';
import { EmptyState, ErrorAlert, Loading, ProfitText, StatCard } from '../components/common';
import { useLayout } from '../components/Layout';
import { CurrencyChip } from '../components/SecuritySearch';
import { SellDialog } from '../components/SellDialog';
import { KRW_COLOR, USD_COLOR } from '../lib/chart';
import {
  formatDate,
  formatExchangeRate,
  formatMoney,
  formatPrice,
  formatQuantity,
  formatRate,
  toNumber,
} from '../lib/format';

export function SecurityDetailPage() {
  const { securityId = '' } = useParams();
  const { openRegister } = useLayout();
  const { data, isLoading, error, refetch } = usePurchases(securityId);
  const [selling, setSelling] = useState<PurchaseHistoryItem | null>(null);

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

  if (isLoading) return <Loading />;
  if (error) return <ErrorAlert error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const { security } = data;

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
          <Typography variant="body2" color="text.secondary">
            {security.symbol} · {security.id}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => openRegister(security)}>
          추가 매수
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="보유 수량" value={`${formatQuantity(stats.quantity)}주`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="평균 매수가"
            value={stats.average === null ? '-' : formatPrice(stats.average, security.currency)}
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

      <Card sx={{ mt: 2 }}>
        <CardHeader title="매수 내역" slotProps={{ title: { variant: 'h6' } }} />
        {data.items.length === 0 ? (
          <EmptyState title="매수 내역이 없습니다." />
        ) : (
          <PurchaseTable security={security} items={data.items} onSell={setSelling} />
        )}
      </Card>

      <SellDialog security={security} purchase={selling} onClose={() => setSelling(null)} />
    </>
  );
}

function PurchaseTable({
  security,
  items,
  onSell,
}: {
  security: SecurityInfo;
  items: PurchaseHistoryItem[];
  onSell: (item: PurchaseHistoryItem) => void;
}) {
  const isUsd = security.currency === 'USD';
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>매수일</TableCell>
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
              <TableCell align="right">{formatQuantity(item.amount)}</TableCell>
              <TableCell align="right">{formatPrice(item.price, security.currency)}</TableCell>
              <TableCell align="right">
                {formatMoney(toNumber(item.amount) * toNumber(item.price), security.currency)}
              </TableCell>
              {isUsd && (
                <TableCell align="right">
                  {item.exchangeRate ? (
                    <Tooltip title={`${formatDate(item.exchangeRateDate)} 기준`}>
                      <span>{formatExchangeRate(item.exchangeRate)}</span>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </TableCell>
              )}
              <TableCell>
                {item.saleDate ? (
                  <Chip size="small" label={`${formatDate(item.saleDate)} 매도`} />
                ) : (
                  <Chip size="small" color="primary" variant="outlined" label="보유 중" />
                )}
              </TableCell>
              <TableCell align="right">
                {!item.saleDate && (
                  <Button size="small" color="error" onClick={() => onSell(item)}>
                    매도
                  </Button>
                )}
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

function PriceChartCard({ security, average }: { security: SecurityInfo; average: number | null }) {
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]['key']>('6M');
  const months = RANGES.find((r) => r.key === rangeKey)?.months ?? null;
  // 날짜가 바뀌어도 캐시 키가 매 렌더마다 바뀌지 않도록 일 단위로 고정
  const from = months ? dayjs().subtract(months, 'month').format('YYYY-MM-DD') : undefined;
  const { data, isLoading, error } = useDailyPrices(security.id, from);

  const prices = data?.prices ?? [];
  const first = prices[0];
  const last = prices[prices.length - 1];
  const change = first && last ? toNumber(last.closingPrice) - toNumber(first.closingPrice) : null;
  const changeRate = change !== null && first ? (change / toNumber(first.closingPrice)) * 100 : null;
  const color = security.currency === 'KRW' ? KRW_COLOR : USD_COLOR;

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
          <ToggleButtonGroup
            size="small"
            exclusive
            value={rangeKey}
            onChange={(_, v) => v && setRangeKey(v)}
          >
            {RANGES.map((r) => (
              <ToggleButton key={r.key} value={r.key}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
        sx={{ flexWrap: 'wrap', gap: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {isLoading ? (
          <Loading minHeight={280} />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : prices.length === 0 ? (
          <EmptyState title="시세 데이터가 없습니다." />
        ) : (
          <LineChart
            height={300}
            hideLegend
            grid={{ horizontal: true }}
            margin={{ left: 8, right: 8 }}
            xAxis={[
              {
                scaleType: 'time',
                data: prices.map((p) => new Date(p.date)),
                valueFormatter: (d: Date) => dayjs(d).format('YY.MM.DD'),
                tickNumber: 6,
              },
            ]}
            yAxis={[
              {
                width: 72,
                valueFormatter: (v: number) => formatPrice(v, security.currency),
                domainLimit: 'nice',
              },
            ]}
            series={[
              {
                id: 'close',
                data: prices.map((p) => toNumber(p.closingPrice)),
                label: '종가',
                color,
                area: true,
                showMark: false,
                valueFormatter: (v) => (v === null ? '-' : formatPrice(v, security.currency)),
              },
              ...(average !== null
                ? [
                    {
                      id: 'avg',
                      data: prices.map(() => average),
                      label: '평균 매수가',
                      color: '#9A9A9A',
                      showMark: false,
                      valueFormatter: (v: number | null) =>
                        v === null ? '-' : formatPrice(v, security.currency),
                    },
                  ]
                : []),
            ]}
            sx={{
              '& .MuiAreaElement-root': { fillOpacity: 0.12 },
              '& path[data-series="avg"]': { strokeDasharray: '4 4', strokeWidth: 1.5 },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
