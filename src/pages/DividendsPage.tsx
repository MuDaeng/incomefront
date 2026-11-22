import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useDividendHistory, useAccounts } from '../api/queries';
import { AccountSelect } from '../components/AccountSelect';
import { useAccountParam } from '../lib/useAccountParam';
import { useTaxMode } from '../lib/useTaxMode';
import { useTabParam } from '../lib/useTabParam';
import { rankDividends } from '../lib/dividendRanking';
import type { DividendHistoryResponse, DividendItem, MonthlyDividend } from '../api/types';
import {
  EmptyState,
  ErrorAlert,
  KeyValue,
  Loading,
  PageHeader,
  StatCard,
} from '../components/common';
import { DateRange, DateRangeBar, PRESETS } from '../components/DateRangeBar';
import { DividendMetricsSection } from '../components/DividendMetricsSection';
import { DividendRankingTable } from '../components/DividendRankingTable';
import { CurrencyChip } from '../components/SecuritySearch';
import { TaxModeToggle } from '../components/TaxModeToggle';
import { KRW_COLOR, USD_COLOR } from '../lib/chart';
import {
  dividendItemView,
  dividendSummaryView,
  krwTaxAmount,
  TAX_MODE_LABEL,
  type TaxMode,
} from '../lib/dividendTax';
import {
  formatDate,
  formatExchangeRate,
  formatKrw,
  formatKrwCompact,
  formatMoney,
  formatMonth,
  formatPrice,
  formatQuantity,
  formatUsd,
  toNumber,
} from '../lib/format';

const TABS = ['monthly', 'ranking', 'metrics'] as const;
type DividendTab = (typeof TABS)[number];

const PRESET_LIST = [
  PRESETS.today,
  PRESETS.last1w,
  PRESETS.last1m,
  PRESETS.qtd,
  PRESETS.thisYear,
  PRESETS.lastYear,
  PRESETS.last12m,
  PRESETS.all,
];

/** from~to 사이 모든 'YYYY-MM' (최대 10년) */
const monthsBetween = (from: string, to: string): string[] => {
  const result: string[] = [];
  let cur = dayjs(from).startOf('month');
  const end = dayjs(to).startOf('month');
  while (!cur.isAfter(end) && result.length < 120) {
    result.push(cur.format('YYYY-MM'));
    cur = cur.add(1, 'month');
  }
  return result;
};

export function DividendsPage() {
  const [presetKey, setPresetKey] = useState<string | null>(PRESETS.thisYear.key);
  const [range, setRange] = useState<DateRange>(PRESETS.thisYear.range);
  const [accountId, setAccountId] = useAccountParam();
  const [taxMode, setTaxMode] = useTaxMode();
  const [tab, setTab] = useTabParam(TABS);
  const { data: accounts } = useAccounts();
  const { data, isLoading, isFetching, error, refetch } = useDividendHistory(
    range.from,
    range.to,
    accountId,
  );

  const chartMonths = useMemo(() => {
    if (!data) return [];
    const byMonth = new Map(data.months.map((m) => [m.month, m]));
    const keys =
      range.from && range.to
        ? monthsBetween(range.from, range.to)
        : data.months.map((m) => m.month);
    return keys.map((month) => {
      const summary = byMonth.get(month)?.summary;
      const view = summary ? dividendSummaryView(summary, taxMode) : undefined;
      return {
        month,
        krw: toNumber(view?.krwAmount ?? 0),
        usdKrw: toNumber(view?.usdKrwAmount ?? 0),
      };
    });
  }, [data, range.from, range.to, taxMode]);

  const today = dayjs().format('YYYY-MM-DD');
  const monthCount = chartMonths.length || 1;
  const total = data ? dividendSummaryView(data.total, taxMode) : undefined;
  const scheduled = data ? dividendSummaryView(data.scheduled.total, taxMode) : undefined;

  return (
    <>
      <PageHeader
        title="배당금"
        subtitle={`배당락일 전날 보유 수량 × 주당 배당금 (${TAX_MODE_LABEL[taxMode]}) · 미국 배당은 지급일 환율로 원화 환산 · 지급 예정 배당은 따로 표시`}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TaxModeToggle value={taxMode} onChange={setTaxMode} />
            <AccountSelect
              allowAll
              size="small"
              width={210}
              value={accountId ?? null}
              onChange={setAccountId}
              accounts={accounts}
            />
          </Stack>
        }
      />
      <DateRangeBar
        presets={PRESET_LIST}
        presetKey={presetKey}
        range={range}
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
      ) : data && total && scheduled ? (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              highlight
              label={`총 배당금 (${TAX_MODE_LABEL[taxMode]})`}
              value={formatKrw(total.totalKrwAmount)}
              footer={
                <>
                  <KeyValue
                    label="월 평균"
                    value={formatKrw(toNumber(total.totalKrwAmount) / monthCount)}
                  />
                  {taxMode === 'after' && (
                    <KeyValue label="세금 (원화 환산)" value={formatKrw(krwTaxAmount(data.total))} />
                  )}
                  <KeyValue label="지급 예정 (원화 환산)" value={formatKrw(scheduled.totalKrwAmount)} />
                </>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="국내 배당금"
              value={formatKrw(total.krwAmount)}
              footer={<KeyValue label="지급 예정" value={formatKrw(scheduled.krwAmount)} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="미국 배당금"
              value={formatUsd(total.usdAmount)}
              footer={<KeyValue label="원화 환산" value={formatKrw(total.usdKrwAmount)} />}
            />
          </Grid>
        </Grid>
      ) : null}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tabs value={tab} onChange={(_, v: DividendTab) => setTab(v)} variant="scrollable">
            <Tab value="monthly" label="월별 내역" />
            <Tab value="ranking" label="배당금 순위" />
            <Tab value="metrics" label="배당 지표" />
          </Tabs>
        </Box>
      </Card>

      <Box sx={{ mt: 2 }}>
        {tab === 'monthly' && data && scheduled && (
          <MonthlyTab
            data={data}
            chartMonths={chartMonths}
            scheduledTotalKrw={scheduled.totalKrwAmount}
            today={today}
            taxMode={taxMode}
          />
        )}
        {tab === 'ranking' && data && <RankingTab data={data} taxMode={taxMode} accountId={accountId} />}
        {/* 배당 지표는 오늘 기준이라 기간 필터·배당 내역 조회와 무관하다 */}
        {tab === 'metrics' && <DividendMetricsSection accountId={accountId} />}
      </Box>
    </>
  );
}

type ChartMonth = { month: string; krw: number; usdKrw: number };

/** 월별 내역 탭: 지급 예정 카드 + 월별 차트 + 월별 아코디언 */
function MonthlyTab({
  data,
  chartMonths,
  scheduledTotalKrw,
  today,
  taxMode,
}: {
  data: DividendHistoryResponse;
  chartMonths: ChartMonth[];
  scheduledTotalKrw: string;
  today: string;
  taxMode: TaxMode;
}) {
  return (
    <>
      {data.scheduled.items.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardHeader
            title={`지급 예정 ${data.scheduled.items.length}건 · ${formatKrw(scheduledTotalKrw)}`}
            subheader="지급일이 오늘 이후인 배당 (총 배당금·월별 내역에는 들어가지 않아요)"
            slotProps={{ title: { variant: 'h6' } }}
          />
          <TableContainer>
            <Table size="small">
              <DividendTableHead taxMode={taxMode} />
              <TableBody>
                {data.scheduled.items.map((item) => (
                  <DividendRow
                    key={`${item.securityId}-${item.noticeDate}-${item.paymentDate}`}
                    item={item}
                    today={today}
                    taxMode={taxMode}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {data.months.length === 0 ? (
        // 지급분이 없어도 지급 예정 배당이 있으면 위 카드만 보여준다
        data.scheduled.items.length === 0 && <NoDividends />
      ) : (
        <>
          <Card sx={{ mb: 2 }}>
            <CardHeader title="월별 배당금" slotProps={{ title: { variant: 'h6' } }} />
            <CardContent sx={{ pt: 0 }}>
              <BarChart
                height={300}
                grid={{ horizontal: true }}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: chartMonths.map((m) => m.month),
                    valueFormatter: (m: string, ctx) =>
                      ctx.location === 'tick' ? `${Number(m.slice(5))}월` : formatMonth(m),
                  },
                ]}
                yAxis={[{ width: 56, valueFormatter: (v: number) => formatKrwCompact(v) }]}
                series={[
                  {
                    data: chartMonths.map((m) => m.krw),
                    label: '국내',
                    stack: 'total',
                    color: KRW_COLOR,
                    valueFormatter: (v) => formatKrw(v),
                  },
                  {
                    data: chartMonths.map((m) => m.usdKrw),
                    label: '미국(원화 환산)',
                    stack: 'total',
                    color: USD_COLOR,
                    valueFormatter: (v) => formatKrw(v),
                  },
                ]}
                borderRadius={4}
              />
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mb: 1.5 }}>
            월별 내역
          </Typography>
          {[...data.months].reverse().map((m, idx) => (
            <MonthAccordion
              key={m.month}
              month={m}
              defaultExpanded={idx === 0}
              today={today}
              taxMode={taxMode}
            />
          ))}
        </>
      )}
    </>
  );
}

/** 배당금 순위 탭: 기간 안에 지급받은 배당의 종목별 합계 순위 */
function RankingTab({
  data,
  taxMode,
  accountId,
}: {
  data: DividendHistoryResponse;
  taxMode: TaxMode;
  accountId?: number;
}) {
  const items = useMemo(() => rankDividends(data.months, taxMode), [data, taxMode]);
  if (items.length === 0) return <NoDividends />;
  return (
    <Card>
      <CardHeader
        title={`배당금 순위 (${TAX_MODE_LABEL[taxMode]})`}
        subheader="이 기간에 지급받은 배당금을 종목별로 합산 · 원화 환산 합이 큰 순서 (지급 예정 제외)"
        slotProps={{ title: { variant: 'h6' } }}
      />
      <DividendRankingTable items={items} accountId={accountId} />
    </Card>
  );
}

function NoDividends() {
  return (
    <Card>
      <EmptyState
        title="이 기간에 받은 배당금이 없어요"
        description="기간을 바꾸거나 배당 종목의 매수 내역을 등록해 보세요."
      />
    </Card>
  );
}

function MonthAccordion({
  month,
  defaultExpanded,
  today,
  taxMode,
}: {
  month: MonthlyDividend;
  defaultExpanded: boolean;
  today: string;
  taxMode: TaxMode;
}) {
  const summary = dividendSummaryView(month.summary, taxMode);
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      variant="outlined"
      sx={{ '&:not(:last-child)': { mb: 1 }, borderRadius: 2, '&::before': { display: 'none' } }}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{formatMonth(month.month)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {month.items.length}건
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontWeight: 700 }}>{formatKrw(summary.totalKrwAmount)}</Typography>
            {toNumber(summary.usdAmount) > 0 && (
              <Typography variant="caption" color="text.secondary">
                국내 {formatKrw(summary.krwAmount)} · 미국 {formatUsd(summary.usdAmount)}
              </Typography>
            )}
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small">
            <DividendTableHead taxMode={taxMode} />
            <TableBody>
              {month.items.map((item) => (
                <DividendRow key={`${item.securityId}-${item.noticeDate}-${item.paymentDate}`} item={item} today={today} taxMode={taxMode} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}

function DividendTableHead({ taxMode }: { taxMode: TaxMode }) {
  return (
    <TableHead>
      <TableRow>
        <TableCell>지급일</TableCell>
        <TableCell>종목</TableCell>
        <TableCell>배당락일</TableCell>
        <TableCell>기준일</TableCell>
        <TableCell align="right">주당 배당금</TableCell>
        <TableCell align="right">보유 수량</TableCell>
        {taxMode === 'after' && <TableCell align="right">세금</TableCell>}
        <TableCell align="right">{taxMode === 'after' ? '세후 배당금' : '배당금'}</TableCell>
        <TableCell align="right">원화 환산</TableCell>
      </TableRow>
    </TableHead>
  );
}

function DividendRow({ item, today, taxMode }: { item: DividendItem; today: string; taxMode: TaxMode }) {
  const upcoming = item.paymentDate > today;
  const view = dividendItemView(item, taxMode);
  return (
    <TableRow hover>
      <TableCell>
        {formatDate(item.paymentDate)}
        {upcoming && <Chip size="small" label="지급 예정" color="warning" variant="outlined" sx={{ ml: 1, height: 20 }} />}
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CurrencyChip currency={item.currency} />
          <Typography variant="body2" noWrap sx={{ maxWidth: 220, fontWeight: 600 }}>
            {item.name}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        {item.exDividendDate ? (
          formatDate(item.exDividendDate)
        ) : (
          <Tooltip title="배당락일이 아직 저장되지 않은 배당이에요. 기준일 보유 수량으로 계산했어요.">
            <span>-</span>
          </Tooltip>
        )}
      </TableCell>
      <TableCell>{formatDate(item.noticeDate)}</TableCell>
      <TableCell align="right">{formatPrice(item.perShareAmount, item.currency)}</TableCell>
      <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
      {taxMode === 'after' && (
        <TableCell align="right">{formatMoney(item.taxAmount, item.currency)}</TableCell>
      )}
      <TableCell align="right">{formatMoney(view.amount, item.currency)}</TableCell>
      <TableCell align="right">
        {item.currency === 'KRW' ? (
          formatKrw(view.krwAmount)
        ) : view.krwAmount ? (
          <Tooltip title={`환율 ${formatExchangeRate(item.exchangeRate)} (${formatDate(item.exchangeRateDate)})`}>
            <span>{formatKrw(view.krwAmount)}</span>
          </Tooltip>
        ) : (
          <Tooltip title="지급일 환율 정보가 아직 없습니다.">
            <span>-</span>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}
