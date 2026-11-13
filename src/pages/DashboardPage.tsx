import Add from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntegratedBalance } from '../api/queries';
import type { BalanceItem } from '../api/types';
import {
  EmptyState,
  ErrorAlert,
  KeyValue,
  Loading,
  PageHeader,
  ProfitText,
  StatCard,
} from '../components/common';
import { useLayout } from '../components/Layout';
import { CurrencyChip } from '../components/SecuritySearch';
import {
  formatDate,
  formatExchangeRate,
  formatKrw,
  formatPrice,
  formatQuantity,
  formatSignedKrw,
  formatSignedUsd,
  formatUsd,
  toNumber,
} from '../lib/format';
import { CHART_COLORS, KRW_COLOR, USD_COLOR } from '../lib/chart';

type Filter = 'ALL' | 'KRW' | 'USD';

export function DashboardPage() {
  const { openRegister } = useLayout();
  const { data, isLoading, error, refetch } = useIntegratedBalance();
  const [filter, setFilter] = useState<Filter>('ALL');

  const items = useMemo(
    () =>
      (data?.items ?? [])
        .filter((i) => filter === 'ALL' || i.currency === filter)
        .sort((a, b) => toNumber(b.krwEvaluationAmount) - toNumber(a.krwEvaluationAmount)),
    [data, filter],
  );

  const registerButton = (
    <Button variant="contained" startIcon={<Add />} onClick={() => openRegister()}>
      매수 등록
    </Button>
  );

  if (isLoading) return <Loading />;
  if (error) return <ErrorAlert error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  if (data.items.length === 0) {
    return (
      <>
        <PageHeader title="통합잔고" />
        <Card>
          <EmptyState
            title="아직 보유 종목이 없어요"
            description="첫 매수 내역을 등록하면 잔고·배당금·수익률을 계산해 드려요."
            action={registerButton}
          />
        </Card>
      </>
    );
  }

  const { total, krwTotal, usdTotal } = data;
  const totalProfit = toNumber(total.evaluationAmount) - toNumber(total.purchaseAmount);
  const krwProfit = toNumber(krwTotal.evaluationAmount) - toNumber(krwTotal.purchaseAmount);
  const usdProfit = toNumber(usdTotal.usdEvaluationAmount) - toNumber(usdTotal.usdPurchaseAmount);
  const usdKrwProfit = toNumber(usdTotal.krwEvaluationAmount) - toNumber(usdTotal.krwPurchaseAmount);

  return (
    <>
      <PageHeader
        title="통합잔고"
        subtitle={
          data.exchangeRate
            ? `USD 환율 ${formatExchangeRate(data.exchangeRate)} (${formatDate(data.exchangeRateDate)} 기준) · 최신 종가 기준 평가`
            : '최신 종가 기준 평가'
        }
        action={registerButton}
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard
            highlight
            label="총 평가금액"
            value={formatKrw(total.evaluationAmount)}
            sub={
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatSignedKrw(totalProfit)} ({formatRateRaw(total.returnRate)})
              </Typography>
            }
            footer={<KeyValue label="총 매입금액" value={formatKrw(total.purchaseAmount)} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="국내 주식"
            value={formatKrw(krwTotal.evaluationAmount)}
            sub={
              <ProfitText value={krwProfit}>
                {formatSignedKrw(krwProfit)} ({formatRateRaw(krwTotal.returnRate)})
              </ProfitText>
            }
            footer={<KeyValue label="매입금액" value={formatKrw(krwTotal.purchaseAmount)} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="미국 주식"
            value={formatKrw(usdTotal.krwEvaluationAmount)}
            sub={
              <ProfitText value={usdKrwProfit}>
                {formatSignedKrw(usdKrwProfit)} ({formatRateRaw(usdTotal.returnRate)})
              </ProfitText>
            }
            footer={
              <>
                <KeyValue
                  label="외화 평가 / 손익"
                  value={
                    <>
                      {formatUsd(usdTotal.usdEvaluationAmount)}{' '}
                      <ProfitText value={usdProfit}>{formatSignedUsd(usdProfit)}</ProfitText>
                    </>
                  }
                />
                <KeyValue label="매입금액(원화 환산)" value={formatKrw(usdTotal.krwPurchaseAmount)} />
              </>
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AllocationCard items={data.items} />
        </Grid>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardHeader
              title="보유 종목"
              slotProps={{ title: { variant: 'h6' } }}
              action={
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={filter}
                  onChange={(_, v: Filter | null) => v && setFilter(v)}
                >
                  <ToggleButton value="ALL">전체</ToggleButton>
                  <ToggleButton value="KRW">국내</ToggleButton>
                  <ToggleButton value="USD">미국</ToggleButton>
                </ToggleButtonGroup>
              }
            />
            <HoldingsTable items={items} />
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

const formatRateRaw = (v: string) => {
  const n = toNumber(v);
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
};

function HoldingsTable({ items }: { items: BalanceItem[] }) {
  const navigate = useNavigate();
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>종목</TableCell>
            <TableCell align="right">보유수량</TableCell>
            <TableCell align="right">현재가</TableCell>
            <TableCell align="right">매입평균가</TableCell>
            <TableCell align="right">평가금액</TableCell>
            <TableCell align="right">평가손익</TableCell>
            <TableCell align="right">수익률</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const isUsd = item.currency === 'USD';
            const krwProfit = toNumber(item.krwEvaluationAmount) - toNumber(item.krwPurchaseAmount);
            const usdProfit = isUsd
              ? toNumber(item.usdEvaluationAmount) - toNumber(item.usdPurchaseAmount)
              : null;
            return (
              <TableRow
                key={item.securityId}
                hover
                onClick={() => navigate(`/securities/${encodeURIComponent(item.securityId)}`)}
                sx={{ cursor: 'pointer', '& td': { py: 1.25 } }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <CurrencyChip currency={item.currency} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 220 }} noWrap>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.securityId}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="right">{formatQuantity(item.amount)}</TableCell>
                <TableCell align="right">{formatPrice(item.currentPrice, item.currency)}</TableCell>
                <TableCell align="right">
                  {isUsd ? formatUsd(item.usdAveragePrice, 4) : formatKrw(item.krwAveragePrice)}
                  {isUsd && <Secondary>{formatKrw(item.krwAveragePrice)}</Secondary>}
                </TableCell>
                <TableCell align="right">
                  {formatKrw(item.krwEvaluationAmount)}
                  {isUsd && <Secondary>{formatUsd(item.usdEvaluationAmount)}</Secondary>}
                </TableCell>
                <TableCell align="right">
                  <ProfitText value={krwProfit}>{formatSignedKrw(krwProfit)}</ProfitText>
                  {usdProfit !== null && (
                    <Secondary>
                      <ProfitText value={usdProfit} fontWeight={400} variant="caption">
                        {formatSignedUsd(usdProfit)}
                      </ProfitText>
                    </Secondary>
                  )}
                </TableCell>
                <TableCell align="right">
                  <ProfitText value={item.returnRate} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function Secondary({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="div" variant="caption" color="text.secondary">
      {children}
    </Typography>
  );
}

function AllocationCard({ items }: { items: BalanceItem[] }) {
  const [by, setBy] = useState<'security' | 'currency'>('security');

  const data = useMemo(() => {
    if (by === 'currency') {
      const sum = (c: string) =>
        items.filter((i) => i.currency === c).reduce((s, i) => s + toNumber(i.krwEvaluationAmount), 0);
      return [
        { id: 'KRW', label: '국내', value: sum('KRW'), color: KRW_COLOR },
        { id: 'USD', label: '미국', value: sum('USD'), color: USD_COLOR },
      ].filter((d) => d.value > 0);
    }
    const sorted = [...items].sort(
      (a, b) => toNumber(b.krwEvaluationAmount) - toNumber(a.krwEvaluationAmount),
    );
    const top = sorted.slice(0, 6).map((i, idx) => ({
      id: i.securityId,
      label: i.name,
      value: toNumber(i.krwEvaluationAmount),
      color: CHART_COLORS[idx],
    }));
    const rest = sorted.slice(6).reduce((s, i) => s + toNumber(i.krwEvaluationAmount), 0);
    return rest > 0
      ? [...top, { id: 'etc', label: '기타', value: rest, color: CHART_COLORS[6] }]
      : top;
  }, [items, by]);

  const sum = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="자산 구성"
        slotProps={{ title: { variant: 'h6' } }}
        action={
          <ToggleButtonGroup size="small" exclusive value={by} onChange={(_, v) => v && setBy(v)}>
            <ToggleButton value="security">종목</ToggleButton>
            <ToggleButton value="currency">시장</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <PieChart
          height={220}
          hideLegend
          series={[
            {
              data,
              innerRadius: 60,
              outerRadius: 100,
              paddingAngle: 1,
              cornerRadius: 3,
              valueFormatter: (v) => `${formatKrw(v.value)} (${((v.value / sum) * 100).toFixed(1)}%)`,
            },
          ]}
        />
        <Stack spacing={0.75} sx={{ mt: 2 }}>
          {data.map((d) => (
            <Stack key={d.id} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Box
                  sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: d.color, flexShrink: 0 }}
                />
                <Typography variant="body2" noWrap>
                  {d.label}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                {((d.value / sum) * 100).toFixed(1)}%
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
