import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Grid,
  IconButton,
  Link,
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
import { Fragment, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMonthlyBalance } from '../api/queries';
import type { MonthlyBalanceMonth, MonthlyBalanceResponse } from '../api/types';
import {
  EmptyState,
  ErrorAlert,
  KeyValue,
  Loading,
  PageHeader,
  ProfitText,
  StatCard,
} from '../components/common';
import { CurrencyChip } from '../components/SecuritySearch';
import { CHART_COLORS } from '../lib/chart';
import {
  formatDate,
  formatKrw,
  formatKrwCompact,
  formatQuantity,
  formatRate,
  formatSignedKrw,
  toNumber,
} from '../lib/format';
import { MONTH_PRESETS, type MonthPresetKey, monthRange, totalReturnRate } from '../lib/months';

const PURCHASE_COLOR = '#9A9A9A';
const EVALUATION_COLOR = CHART_COLORS[2];
const TOTAL_COLOR = CHART_COLORS[0];

const monthLabel = (month: string) => dayjs(`${month}-01`).format('YY.MM');

export function MonthlyPage() {
  const [presetKey, setPresetKey] = useState<MonthPresetKey>('1Y');
  const months = MONTH_PRESETS.find((p) => p.key === presetKey)?.months ?? 12;
  // 오늘 날짜는 렌더마다 바뀌지 않도록 일 단위 문자열로 고정 (캐시 키 안정)
  const { from, to } = monthRange(months, dayjs().format('YYYY-MM-DD'));
  const { data, isLoading, error, refetch } = useMonthlyBalance(from, to);

  return (
    <>
      <PageHeader
        title="월별 추이"
        subtitle="매월 말 기준 원금·평가금액과 누적 배당을 포함한 총자산"
        action={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={presetKey}
            onChange={(_, v) => v && setPresetKey(v)}
            aria-label="기간"
          >
            {MONTH_PRESETS.map((p) => (
              <ToggleButton key={p.key} value={p.key}>
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
      />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      ) : data ? (
        <MonthlyContent data={data} />
      ) : null}
    </>
  );
}

function MonthlyContent({ data }: { data: MonthlyBalanceResponse }) {
  const last = data.months[data.months.length - 1];
  if (!last || data.months.every((m) => m.items.length === 0)) {
    return (
      <Card>
        <EmptyState title="이 기간에 보유했던 종목이 없어요" description="기간을 바꿔서 조회해 보세요." />
      </Card>
    );
  }

  const t = last.total;
  const profit = toNumber(t.totalAmount) - toNumber(t.purchaseAmount);
  const rate = totalReturnRate(t.totalAmount, t.purchaseAmount);
  const evalProfit = toNumber(t.evaluationAmount) - toNumber(t.purchaseAmount);

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <StatCard
            highlight
            label={`평가금액 + 누적배당금 (${formatDate(last.date)} 기준)`}
            value={formatKrw(t.totalAmount)}
            footer={
              <>
                <KeyValue
                  label="총수익"
                  value={`${formatSignedKrw(profit)}${rate === null ? '' : ` (${formatRate(rate)})`}`}
                />
                <KeyValue label="원금" value={formatKrw(t.purchaseAmount)} />
              </>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <StatCard
            label="평가금액"
            value={formatKrw(t.evaluationAmount)}
            sub={<ProfitText value={evalProfit}>{formatSignedKrw(evalProfit)} 평가손익</ProfitText>}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <StatCard
            label="누적배당금"
            value={formatKrw(t.dividendAmount)}
            sub={
              <Typography variant="body2" color="text.secondary">
                처음부터 {formatDate(last.date)}까지 받은 배당금
              </Typography>
            }
          />
        </Grid>
      </Grid>

      <TrendChart months={data.months} />

      <Card sx={{ mt: 2 }}>
        <CardHeader title="월별 내역" slotProps={{ title: { variant: 'h6' } }} subheader="행을 누르면 종목별 값을 볼 수 있어요." />
        <MonthTable months={data.months} />
      </Card>
    </>
  );
}

function TrendChart({ months }: { months: MonthlyBalanceMonth[] }) {
  const series = (key: 'purchaseAmount' | 'evaluationAmount' | 'totalAmount') =>
    months.map((m) => toNumber(m.total[key]));

  return (
    <Card>
      <CardHeader title="추이" slotProps={{ title: { variant: 'h6' } }} />
      <CardContent sx={{ pt: 0 }}>
        <LineChart
          height={320}
          grid={{ horizontal: true }}
          margin={{ left: 8, right: 8 }}
          xAxis={[
            {
              scaleType: 'point',
              data: months.map((m) => m.month),
              valueFormatter: (m: string) => monthLabel(m),
            },
          ]}
          yAxis={[{ width: 64, valueFormatter: (v: number) => formatKrwCompact(v) }]}
          series={[
            {
              id: 'total',
              label: '평가금액 + 누적배당금',
              data: series('totalAmount'),
              color: TOTAL_COLOR,
              area: true,
              showMark: months.length <= 24,
              valueFormatter: (v) => (v === null ? '-' : formatKrw(v)),
            },
            {
              id: 'evaluation',
              label: '평가금액',
              data: series('evaluationAmount'),
              color: EVALUATION_COLOR,
              showMark: months.length <= 24,
              valueFormatter: (v) => (v === null ? '-' : formatKrw(v)),
            },
            {
              id: 'purchase',
              label: '원금',
              data: series('purchaseAmount'),
              color: PURCHASE_COLOR,
              showMark: false,
              valueFormatter: (v) => (v === null ? '-' : formatKrw(v)),
            },
          ]}
          sx={{
            '& .MuiAreaElement-root': { fillOpacity: 0.1 },
            '& path[data-series="purchase"]': { strokeDasharray: '4 4', strokeWidth: 1.5 },
          }}
        />
      </CardContent>
    </Card>
  );
}

function MonthTable({ months }: { months: MonthlyBalanceMonth[] }) {
  const [open, setOpen] = useState<string | null>(null);
  // 최근 달이 위로
  const rows = [...months].reverse();

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>년월</TableCell>
            <TableCell align="right">원금</TableCell>
            <TableCell align="right">평가금액</TableCell>
            <TableCell align="right">누적배당금</TableCell>
            <TableCell align="right">평가 + 배당</TableCell>
            <TableCell align="right">수익률</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((m) => {
            const isOpen = open === m.month;
            const rate = totalReturnRate(m.total.totalAmount, m.total.purchaseAmount);
            return (
              <Fragment key={m.month}>
                <TableRow
                  hover
                  onClick={() => setOpen(isOpen ? null : m.month)}
                  sx={{ cursor: 'pointer', '& > td': { borderBottom: isOpen ? 'unset' : undefined } }}
                >
                  <TableCell padding="checkbox">
                    <IconButton size="small" aria-label={isOpen ? '접기' : '종목별 보기'}>
                      {isOpen ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`${formatDate(m.date)} 기준`}>
                      <span>{dayjs(`${m.month}-01`).format('YYYY년 M월')}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">{formatKrw(m.total.purchaseAmount)}</TableCell>
                  <TableCell align="right">{formatKrw(m.total.evaluationAmount)}</TableCell>
                  <TableCell align="right">{formatKrw(m.total.dividendAmount)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatKrw(m.total.totalAmount)}
                  </TableCell>
                  <TableCell align="right">
                    {rate === null ? '-' : <ProfitText value={rate}>{formatRate(rate)}</ProfitText>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 0, ...(isOpen ? {} : { borderBottom: 'none' }) }}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ py: 1.5 }}>
                        <ItemTable month={m} />
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ItemTable({ month }: { month: MonthlyBalanceMonth }) {
  if (month.items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
        이 달에 보유했거나 배당을 받은 종목이 없습니다.
      </Typography>
    );
  }
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>종목</TableCell>
          <TableCell align="right">수량</TableCell>
          <TableCell align="right">원금</TableCell>
          <TableCell align="right">평가금액</TableCell>
          <TableCell align="right">누적배당금</TableCell>
          <TableCell align="right">평가 + 배당</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {month.items.map((i) => (
          <TableRow key={i.securityId}>
            <TableCell>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Link component={RouterLink} to={`/securities/${i.securityId}`} underline="hover">
                  {i.name}
                </Link>
                <CurrencyChip currency={i.currency} />
              </Stack>
            </TableCell>
            <TableCell align="right">
              {toNumber(i.quantity) > 0 ? `${formatQuantity(i.quantity)}주` : '매도'}
            </TableCell>
            <TableCell align="right">{formatKrw(i.purchaseAmount)}</TableCell>
            <TableCell align="right">{formatKrw(i.evaluationAmount)}</TableCell>
            <TableCell align="right">{formatKrw(i.dividendAmount)}</TableCell>
            <TableCell align="right">{formatKrw(i.totalAmount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
