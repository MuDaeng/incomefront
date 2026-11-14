import dayjs from 'dayjs';
import { toNumber } from './format';

/** 차트용 봉 하나 (date는 그 봉의 첫 거래일, 'YYYY-MM-DD') */
export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type CandleInterval = 'day' | 'week';

interface DailyPriceLike {
  date: string;
  openingPrice: string;
  closingPrice: string;
  highestPrice: string;
  lowestPrice: string;
}

/** 일별 시세(decimal string)를 날짜 오름차순 일봉으로 변환 */
export function toDailyCandles(prices: DailyPriceLike[]): Candle[] {
  return prices
    .map((p) => ({
      date: p.date,
      open: toNumber(p.openingPrice),
      high: toNumber(p.highestPrice),
      low: toNumber(p.lowestPrice),
      close: toNumber(p.closingPrice),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** 그 주의 월요일 ('YYYY-MM-DD') */
export function weekStart(date: string): string {
  const d = dayjs(date);
  return d.subtract((d.day() + 6) % 7, 'day').format('YYYY-MM-DD');
}

/**
 * 일봉(날짜 오름차순)을 월~일 기준 주봉으로 묶는다.
 * 시가 = 첫 거래일 시가, 종가 = 마지막 거래일 종가, 고가/저가 = 주중 최고/최저.
 */
export function toWeeklyCandles(daily: Candle[]): Candle[] {
  const weeks: Candle[] = [];
  let currentWeek: string | null = null;
  for (const c of daily) {
    const week = weekStart(c.date);
    const last = weeks[weeks.length - 1];
    if (week !== currentWeek || !last) {
      weeks.push({ ...c });
      currentWeek = week;
    } else {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
    }
  }
  return weeks;
}

export function toCandles(prices: DailyPriceLike[], interval: CandleInterval): Candle[] {
  const daily = toDailyCandles(prices);
  return interval === 'week' ? toWeeklyCandles(daily) : daily;
}

/** y축 범위: 저가~고가(+ 함께 그릴 기준선)에 위아래 여백을 둔다 */
export function priceDomain(
  candles: Candle[],
  extra: number | null = null,
  paddingRatio = 0.05,
): { min: number; max: number } | null {
  if (candles.length === 0) return null;
  let min = Math.min(...candles.map((c) => c.low));
  let max = Math.max(...candles.map((c) => c.high));
  if (extra !== null) {
    min = Math.min(min, extra);
    max = Math.max(max, extra);
  }
  const pad = (max - min) * paddingRatio || Math.abs(max) * paddingRatio || 1;
  return { min: Math.max(0, min - pad), max: max + pad };
}
