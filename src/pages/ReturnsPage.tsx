import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  LinearProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useMemo, useState } from 'react';
import { usePeriodReturn } from '../api/queries';
import type { PeriodReturnResponse } from '../api/types';
import {
  EmptyState,
  ErrorAlert,
  KeyValue,
  Loading,
  PageHeader,
  ProfitText,
  StatCard,
} from '../components/common';
import { DateRange, DateRangeBar, PRESETS } from '../components/DateRangeBar';
import { CurrencyChip } from '../components/SecuritySearch';
import { KRW_COLOR, USD_COLOR } from '../lib/chart';
import {
  formatDate,
  formatExchangeRate,
  formatKrw,
  formatKrwCompact,
  formatPrice,
  formatQuantity,
  formatRate,
  formatSignedKrw,
  formatUsd,
  toNumber,
} from '../lib/format';

const PRESET_LIST = [PRESETS.ytd, PRESETS.last12m, PRESETS.last3y];

export function ReturnsPage() {
  const [presetKey, setPresetKey] = useState<string | null>(PRESETS.ytd.key);
  const [range, setRange] = useState<DateRange>(PRESETS.ytd.range);
  const from = range.from!;
  const to = range.to!;
  const { data, isLoading, isFetching, error, refetch } = usePeriodReturn(from, to);

  return (
    <>
      <PageHeader
        title="기간 수익률"
        subtitle="종료일 보유분 평가손익 + 기간 중 받은 배당금 = 원금 대비 총수익"
      />
      <DateRangeBar
        presets={PRESET_LIST}
        presetKey={presetKey}
        range={range}
        required
        onChange={(r, key) => {
          setRange(r);
          setPresetKey(key);
        }}
      />
      {isFetching && !isLoading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      ) : data ? (
        <ReturnsContent data={data} />
      ) : null}
    </>
  );
}

function ReturnsContent({ data }: { data: PeriodReturnResponse }) {
  const [tab, setTab] = useState<'total' | 'evaluation' | 'dividend'>('total');
  const t = data.total.total;
  const evalProfit = toNumber(t.evaluationAmount) - toNumber(t.purchaseAmount);

  if (data.total.items.length === 0) {
    return (
      <Card>
        <EmptyState title="이 기간에 보유했던 종목이 없어요" description="기간을 바꿔서 조회해 보세요." />
      </Card>
    );
  }

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <StatCard
            highlight
            label={`총수익 (${formatDate(data.from)} ~ ${formatDate(data.to)})`}
            value={
              <>
                {formatSignedKrw(t.profit)}
                <Typography component="span" variant="h6" sx={{ ml: 1, opacity: 0.9 }}>
                  {formatRate(t.returnRate)}
                </Typography>
              </>
            }
            footer={
              <>
                <KeyValue label="원금" value={formatKrw(t.purchaseAmount)} />
                <KeyValue label="평가금액 + 배당금" value={formatKrw(t.totalAmount)} />
              </>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <StatCard
            label="평가손익"
            value={<ProfitText value={evalProfit} variant="h5">{formatSignedKrw(evalProfit)}</ProfitText>}
            sub={<ProfitText value={data.evaluation.total.returnRate} />}
            footer={<KeyValue label="평가금액" value={formatKrw(t.evaluationAmount)} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <StatCard
            label="배당금"
            value={formatKrw(t.dividendAmount)}
            sub={
              <Typography variant="body2" color="text.secondary">
                원금 대비{' '}
                {toNumber(t.purchaseAmount) > 0
                  ? `${((toNumber(t.dividendAmount) / toNumber(t.purchaseAmount)) * 100).toFixed(2)}%`
                  : '-'}
              </Typography>
            }
            footer={
              <KeyValue
                label="그중 미국 배당"
                value={toNumber(data.dividend.total.usdAmount) > 0 ? formatUsd(data.dividend.total.usdAmount) : '-'}
              />
            }
          />
        </Grid>
      </Grid>

      <ContributionChart data={data} />

      <Card sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
            <Tab value="total" label="종합" />
            <Tab value="evaluation" label="평가금액" />
            <Tab value="dividend" label="배당금" />
          </Tabs>
        </Box>
        {tab === 'total' && <TotalTable data={data} />}
        {tab === 'evaluation' && <EvaluationTable data={data} />}
        {tab === 'dividend' && <DividendTable data={data} />}
      </Card>
      {data.exchangeRate && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          미국 종목 평가 환율 {formatExchangeRate(data.exchangeRate)} ({formatDate(data.exchangeRateDate)} 기준) ·
          원금은 매수일 환율로 환산
        </Typography>
      )}
    </>
  );
}

/** 종목별 수익 기여: 평가손익 + 배당금 */
function ContributionChart({ data }: { data: PeriodReturnResponse }) {
  const rows = useMemo(
    () =>
      [...data.total.items]
        .sort((a, b) => toNumber(b.profit) - toNumber(a.profit))
        .slice(0, 12)
        .map((i) => ({
          name: i.name,
          evaluation: toNumber(i.evaluationAmount) - toNumber(i.purchaseAmount),
          dividend: toNumber(i.dividendAmount),
        })),
    [data],
  );

  return (
    <Card>
      <CardHeader
        title="종목별 수익 기여"
        subheader="수익금 상위 12개 종목"
        slotProps={{ title: { variant: 'h6' } }}
      />
      <CardContent sx={{ pt: 0 }}>
        <BarChart
          height={Math.max(220, rows.length * 36 + 60)}
          layout="horizontal"
          grid={{ vertical: true }}
          yAxis={[
            {
              scaleType: 'band',
              data: rows.map((r) => r.name),
              width: 120,
              valueFormatter: (name: string, ctx) =>
                ctx.location === 'tick' && name.length > 9 ? `${name.slice(0, 9)}…` : name,
            },
          ]}
          xAxis={[{ valueFormatter: (v: number) => formatKrwCompact(v) }]}
          series={[
            {
              data: rows.map((r) => r.evaluation),
              label: '평가손익',
              stack: 'profit',
              color: KRW_COLOR,
              valueFormatter: (v) => formatSignedKrw(v),
            },
            {
              data: rows.map((r) => r.dividend),
              label: '배당금',
              stack: 'profit',
              color: USD_COLOR,
              valueFormatter: (v) => formatKrw(v),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function TotalTable({ data }: { data: PeriodReturnResponse }) {
  const t = data.total.total;
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>종목</TableCell>
            <TableCell align="right">원금</TableCell>
            <TableCell align="right">평가금액</TableCell>
            <TableCell align="right">배당금</TableCell>
            <TableCell align="right">평가 + 배당</TableCell>
            <TableCell align="right">수익금</TableCell>
            <TableCell align="right">수익률</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.total.items.map((i) => (
            <TableRow key={i.securityId} hover>
              <NameCell name={i.name} />
              <TableCell align="right">{formatKrw(i.purchaseAmount)}</TableCell>
              <TableCell align="right">{formatKrw(i.evaluationAmount)}</TableCell>
              <TableCell align="right">{formatKrw(i.dividendAmount)}</TableCell>
              <TableCell align="right">{formatKrw(i.totalAmount)}</TableCell>
              <TableCell align="right">
                <ProfitText value={i.profit}>{formatSignedKrw(i.profit)}</ProfitText>
              </TableCell>
              <TableCell align="right">
                <ProfitText value={i.returnRate} />
              </TableCell>
            </TableRow>
          ))}
          <TotalRow
            cells={[
              formatKrw(t.purchaseAmount),
              formatKrw(t.evaluationAmount),
              formatKrw(t.dividendAmount),
              formatKrw(t.totalAmount),
              <ProfitText value={t.profit}>{formatSignedKrw(t.profit)}</ProfitText>,
              <ProfitText value={t.returnRate} />,
            ]}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function EvaluationTable({ data }: { data: PeriodReturnResponse }) {
  const t = data.evaluation.total;
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>종목</TableCell>
            <TableCell align="right">보유 수량</TableCell>
            <TableCell align="right">종가</TableCell>
            <TableCell align="right">원금</TableCell>
            <TableCell align="right">평가금액</TableCell>
            <TableCell align="right">평가손익</TableCell>
            <TableCell align="right">수익률</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.evaluation.items.map((i) => (
            <TableRow key={i.securityId} hover>
              <NameCell name={i.name} currency={i.currency} />
              <TableCell align="right">{formatQuantity(i.quantity)}</TableCell>
              <TableCell align="right">
                {i.closingPrice ? formatPrice(i.closingPrice, i.currency) : '-'}
                {i.priceDate && (
                  <Typography component="div" variant="caption" color="text.secondary">
                    {formatDate(i.priceDate)}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                {formatKrw(i.krwPurchaseAmount)}
                {i.usdPurchaseAmount && <Sub>{formatUsd(i.usdPurchaseAmount)}</Sub>}
              </TableCell>
              <TableCell align="right">
                {formatKrw(i.krwEvaluationAmount)}
                {i.usdEvaluationAmount && <Sub>{formatUsd(i.usdEvaluationAmount)}</Sub>}
              </TableCell>
              <TableCell align="right">
                <ProfitText value={i.profit}>{formatSignedKrw(i.profit)}</ProfitText>
              </TableCell>
              <TableCell align="right">
                <ProfitText value={i.returnRate} />
              </TableCell>
            </TableRow>
          ))}
          <TotalRow
            cells={[
              '',
              '',
              formatKrw(t.purchaseAmount),
              formatKrw(t.evaluationAmount),
              <ProfitText value={t.profit}>{formatSignedKrw(t.profit)}</ProfitText>,
              <ProfitText value={t.returnRate} />,
            ]}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DividendTable({ data }: { data: PeriodReturnResponse }) {
  if (data.dividend.items.length === 0) {
    return <EmptyState title="이 기간에 받은 배당금이 없어요" />;
  }
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>종목</TableCell>
            <TableCell align="right">달러 배당금</TableCell>
            <TableCell align="right">원화 배당금</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.dividend.items.map((i) => (
            <TableRow key={i.securityId} hover>
              <NameCell name={i.name} currency={i.currency} />
              <TableCell align="right">{i.usdAmount ? formatUsd(i.usdAmount) : '-'}</TableCell>
              <TableCell align="right">{formatKrw(i.krwAmount)}</TableCell>
            </TableRow>
          ))}
          <TotalRow
            cells={[formatUsd(data.dividend.total.usdAmount), formatKrw(data.dividend.total.krwAmount)]}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function NameCell({ name, currency }: { name: string; currency?: 'KRW' | 'USD' }) {
  return (
    <TableCell>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {currency && <CurrencyChip currency={currency} />}
        <Typography variant="body2" noWrap sx={{ maxWidth: 240, fontWeight: 600 }}>
          {name}
        </Typography>
      </Stack>
    </TableCell>
  );
}

function TotalRow({ cells }: { cells: React.ReactNode[] }) {
  return (
    <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover', borderBottom: 0 } }}>
      <TableCell>합계</TableCell>
      {cells.map((c, idx) => (
        <TableCell key={idx} align="right">
          {c}
        </TableCell>
      ))}
    </TableRow>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="div" variant="caption" color="text.secondary">
      {children}
    </Typography>
  );
}
