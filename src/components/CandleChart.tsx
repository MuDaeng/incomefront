import { Box, Paper, Stack, Typography } from '@mui/material';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import { ChartsContainer } from '@mui/x-charts/ChartsContainer';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { ChartsTooltipContainer, useAxesTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { useXScale, useYScale } from '@mui/x-charts/hooks';
import dayjs from 'dayjs';
import type { Currency } from '../api/types';
import { type Candle, type CandleInterval, priceDomain } from '../lib/candles';
import { FALL_COLOR, formatPrice, formatRate, RISE_COLOR } from '../lib/format';

const AVG_COLOR = '#9A9A9A';
const X_TICK_COUNT = 6;

/** 종가 ≥ 시가면 상승(빨강), 아니면 하락(파랑) — 국내 시장 색상 관례 */
const candleColor = (c: Candle) => (c.close >= c.open ? RISE_COLOR : FALL_COLOR);

function CandlePlot({ candles }: { candles: Candle[] }) {
  const xScale = useXScale<'band'>();
  const yScale = useYScale<'linear'>();
  const bandwidth = xScale.bandwidth();
  const bodyWidth = Math.max(1, bandwidth);

  return (
    <g>
      {candles.map((c) => {
        const x = xScale(c.date);
        if (x === undefined) return null;
        const color = candleColor(c);
        const center = x + bandwidth / 2;
        const top = yScale(Math.max(c.open, c.close));
        const bottom = yScale(Math.min(c.open, c.close));
        return (
          <g key={c.date}>
            <line
              x1={center}
              x2={center}
              y1={yScale(c.high)}
              y2={yScale(c.low)}
              stroke={color}
              strokeWidth={1}
            />
            <rect
              x={center - bodyWidth / 2}
              y={top}
              width={bodyWidth}
              height={Math.max(1, bottom - top)}
              fill={color}
            />
          </g>
        );
      })}
    </g>
  );
}

function CandleTooltipContent({
  candles,
  currency,
  interval,
}: {
  candles: Candle[];
  currency: Currency;
  interval: CandleInterval;
}) {
  const axes = useAxesTooltip({ directions: ['x'] });
  const index = axes?.[0]?.dataIndex;
  const c = index === undefined ? undefined : candles[index];
  if (!c) return null;

  const prev = index! > 0 ? candles[index! - 1] : undefined;
  const changeRate = prev ? ((c.close - prev.close) / prev.close) * 100 : null;
  const rows: [string, number][] = [
    ['시가', c.open],
    ['고가', c.high],
    ['저가', c.low],
    ['종가', c.close],
  ];

  return (
    <Paper elevation={4} sx={{ px: 1.5, py: 1, minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">
        {interval === 'week'
          ? `${dayjs(c.date).format('YYYY.MM.DD')} 주`
          : dayjs(c.date).format('YYYY.MM.DD (dd)')}
      </Typography>
      {rows.map(([label, value]) => (
        <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatPrice(value, currency)}
          </Typography>
        </Stack>
      ))}
      {changeRate !== null && (
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant="caption"
            sx={{ color: changeRate > 0 ? RISE_COLOR : changeRate < 0 ? FALL_COLOR : 'text.secondary' }}
          >
            {interval === 'week' ? '전주' : '전일'} 대비 {formatRate(changeRate)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export function CandleChart({
  candles,
  currency,
  interval,
  average,
  height = 300,
}: {
  candles: Candle[];
  currency: Currency;
  interval: CandleInterval;
  average: number | null;
  height?: number;
}) {
  const domain = priceDomain(candles, average);
  const dates = candles.map((c) => c.date);
  const tickStep = Math.max(1, Math.ceil(candles.length / X_TICK_COUNT));
  const sameYear = dates.length > 0 && dates[0].slice(0, 4) === dates[dates.length - 1].slice(0, 4);

  return (
    <ChartsContainer
      height={height}
      margin={{ left: 8, right: 8 }}
      xAxis={[
        {
          id: 'date',
          scaleType: 'band',
          data: dates,
          categoryGapRatio: 0.3,
          tickInterval: (_: string, i: number) => i % tickStep === 0,
          valueFormatter: (d: string) => dayjs(d).format(sameYear ? 'MM.DD' : 'YY.MM.DD'),
        },
      ]}
      yAxis={[
        {
          id: 'price',
          width: 72,
          min: domain?.min,
          max: domain?.max,
          valueFormatter: (v: number) => formatPrice(v, currency),
        },
      ]}
      // 화면에는 그리지 않는다. 축 툴팁/하이라이트가 동작하려면 x축에 연결된 시리즈가 필요하다.
      series={[{ type: 'line', id: 'close', data: candles.map((c) => c.close) }]}
    >
      <ChartsGrid horizontal />
      <ChartsAxisHighlight x="band" />
      <CandlePlot candles={candles} />
      {average !== null && (
        <ChartsReferenceLine
          y={average}
          label="평균 매수가"
          labelAlign="start"
          lineStyle={{ stroke: AVG_COLOR, strokeDasharray: '4 4', strokeWidth: 1.5 }}
          labelStyle={{ fill: AVG_COLOR, fontSize: 11 }}
        />
      )}
      <ChartsXAxis />
      <ChartsYAxis />
      <ChartsTooltipContainer trigger="axis">
        <CandleTooltipContent candles={candles} currency={currency} interval={interval} />
      </ChartsTooltipContainer>
    </ChartsContainer>
  );
}
