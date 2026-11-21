import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Link,
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
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import { Fragment, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMonthlyBalance } from '../api/queries';
import type { MonthlyBalanceMonth } from '../api/types';
import { CHART_COLORS } from '../lib/chart';
import { formatDate, formatKrw, formatKrwCompact, formatQuantity, formatRate, toNumber } from '../lib/format';
import { MAX_MONTHS, monthsForDateRange, totalReturnRate } from '../lib/months';
import { securityDetailPath } from '../lib/account';
import { EmptyState, ErrorAlert, Loading, ProfitText } from './common';
import { CurrencyChip } from './SecuritySearch';

const PURCHASE_COLOR = '#9A9A9A';
const EVALUATION_COLOR = CHART_COLORS[2];
const TOTAL_COLOR = CHART_COLORS[0];

const shortMonth = (month: string) => dayjs(`${month}-01`).format('YY.MM');
const dotMonth = (month: string) => dayjs(`${month}-01`).format('YYYY.MM');

/**
 * 월별 추이 (GET /balance/monthly). 기간 수익률의 날짜 범위('YYYY-MM-DD')를 받아
 * 년월로 바꿔 조회한다 (이번 달·최대 120개월로 줄임).
 */
export function MonthlyTrendSection({
  from,
  to,
  accountId,
}: {
  from: string;
  to: string;
  /** 계좌 필터 (없으면 전체 계좌) */
  accountId?: number;
}) {
  const range = monthsForDateRange(from, to, dayjs().format('YYYY-MM-DD'));
  const { data, isLoading, error, refetch } = useMonthlyBalance(
    range?.from ?? '',
    range?.to ?? '',
    !!range,
    accountId,
  );

  const subheader = range
    ? [
        `${dotMonth(range.from)} ~ ${dotMonth(range.to)}`,
        range.cappedToCurrentMonth && '(이번 달까지)',
        range.cappedToMaxMonths && `(최근 ${MAX_MONTHS}개월)`,
        '· 매월 말 기준, 누적배당금 포함',
      ]
        .filter(Boolean)
        .join(' ')
    : undefined;

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="월별 추이" subheader={subheader} slotProps={{ title: { variant: 'h6' } }} />
      {!range ? (
        <EmptyState title="선택한 기간에 조회할 달이 없습니다." />
      ) : isLoading ? (
        <Loading minHeight={280} />
      ) : error ? (
        <CardContent>
          <ErrorAlert error={error} onRetry={() => refetch()} />
        </CardContent>
      ) : !data || data.months.every((m) => m.items.length === 0) ? (
        <EmptyState title="이 기간에 보유했던 종목이 없어요" />
      ) : (
        <>
          <CardContent sx={{ pt: 0 }}>
            <TrendChart months={data.months} />
          </CardContent>
          <MonthTable months={data.months} accountId={accountId} />
        </>
      )}
    </Card>
  );
}

function TrendChart({ months }: { months: MonthlyBalanceMonth[] }) {
  const series = (key: 'purchaseAmount' | 'evaluationAmount' | 'totalAmount') =>
    months.map((m) => toNumber(m.total[key]));
  const showMark = months.length <= 24;
  const krw = (v: number | null) => (v === null ? '-' : formatKrw(v));

  return (
    <LineChart
      height={320}
      grid={{ horizontal: true }}
      margin={{ left: 8, right: 8 }}
      xAxis={[{ scaleType: 'point', data: months.map((m) => m.month), valueFormatter: shortMonth }]}
      yAxis={[{ width: 64, valueFormatter: (v: number) => formatKrwCompact(v) }]}
      // 선 아래를 채우지 않는다 (채우면 다른 선이 가려짐)
      series={[
        { id: 'total', label: '평가금액 + 누적배당금', data: series('totalAmount'), color: TOTAL_COLOR, showMark, valueFormatter: krw },
        { id: 'evaluation', label: '평가금액', data: series('evaluationAmount'), color: EVALUATION_COLOR, showMark, valueFormatter: krw },
        { id: 'purchase', label: '원금', data: series('purchaseAmount'), color: PURCHASE_COLOR, showMark: false, valueFormatter: krw },
      ]}
      sx={{
        '& path[data-series="total"]': { strokeWidth: 2.5 },
        '& path[data-series="purchase"]': { strokeDasharray: '4 4', strokeWidth: 1.5 },
      }}
    />
  );
}

function MonthTable({
  months,
  accountId,
}: {
  months: MonthlyBalanceMonth[];
  accountId?: number;
}) {
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
                        <ItemTable month={m} accountId={accountId} />
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

function ItemTable({
  month,
  accountId,
}: {
  month: MonthlyBalanceMonth;
  accountId?: number;
}) {
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
                <Link
                  component={RouterLink}
                  to={securityDetailPath(i.securityId, accountId)}
                  underline="hover"
                >
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
