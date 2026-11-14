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
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useDailyPrices, usePurchases } from '../api/queries';
import type { PurchaseHistoryItem, SecurityInfo } from '../api/types';
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
import { CurrencyChip } from '../components/SecuritySearch';
import { SellDialog } from '../components/SellDialog';
import { CandleChart } from '../components/CandleChart';
import { type CandleInterval, toCandles, weekStart } from '../lib/candles';
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
  const [deleting, setDeleting] = useState<PurchaseHistoryItem | null>(null);
  const [editingRate, setEditingRate] = useState<PurchaseHistoryItem | null>(null);
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
        {/* 매수 등록 창이 닫히면 포커스가 이 버튼으로 돌아오므로 포커스 펄스 애니메이션을 끈다 */}
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openRegister(security)}
          disableFocusRipple
          sx={staticFocusSx}
        >
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
          <PurchaseTable
            security={security}
            items={data.items}
            onSell={setSelling}
            onDelete={setDeleting}
            onEditRate={setEditingRate}
          />
        )}
      </Card>

      <SellDialog security={security} purchase={selling} onClose={() => setSelling(null)} />
      <EditExchangeRateDialog
        security={security}
        purchase={editingRate}
        onClose={() => setEditingRate(null)}
      />
      <DeletePurchaseDialog
        security={security}
        purchase={deleting}
        isLast={data.items.length === 1}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          // 마지막 매수분을 지우면 보유 종목에서 빠지므로 통합잔고로 돌아간다
          if (data.items.length === 1) navigate('/');
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
}: {
  security: SecurityInfo;
  items: PurchaseHistoryItem[];
  onSell: (item: PurchaseHistoryItem) => void;
  onDelete: (item: PurchaseHistoryItem) => void;
  onEditRate: (item: PurchaseHistoryItem) => void;
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
