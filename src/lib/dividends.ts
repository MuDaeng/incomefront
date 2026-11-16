import dayjs from 'dayjs';
import type { SecurityMonthlyDividend } from '../api/types';
import { toNumber } from './format';

export interface DividendChartMonth {
  month: string;
  amount: number;
  count: number;
}

/**
 * 지급 있는 달만 오는 `GET /dividends` 결과를 마지막 달까지 끊김 없이 이어 붙이고(없는 달은 0),
 * 최근 `limit`개월만 남긴다. 입력은 월 오름차순.
 */
export const fillDividendMonths = (
  months: SecurityMonthlyDividend[],
  limit: number,
): DividendChartMonth[] => {
  if (months.length === 0) return [];
  const byMonth = new Map(months.map((m) => [m.month, m]));
  const last = dayjs(`${months[months.length - 1].month}-01`);
  const first = dayjs(`${months[0].month}-01`);
  const start = last.subtract(limit - 1, 'month');
  const from = first.isAfter(start) ? first : start;
  const result: DividendChartMonth[] = [];
  for (let d = from; !d.isAfter(last); d = d.add(1, 'month')) {
    const month = d.format('YYYY-MM');
    const found = byMonth.get(month);
    result.push({ month, amount: found ? toNumber(found.amount) : 0, count: found?.count ?? 0 });
  }
  return result;
};

/** `today`가 속한 달까지 최근 12개월(그 달 포함)의 1주당 배당 합계와 지급 횟수. 예정된 미래 달은 빼고 센다 */
export const trailingYearDividend = (
  months: SecurityMonthlyDividend[],
  today: string,
): { amount: number; count: number } => {
  const to = today.slice(0, 7);
  const from = dayjs(`${to}-01`).subtract(11, 'month').format('YYYY-MM');
  return months
    .filter((m) => m.month >= from && m.month <= to)
    .reduce((s, m) => ({ amount: s.amount + toNumber(m.amount), count: s.count + m.count }), {
      amount: 0,
      count: 0,
    });
};

/** 차트 눈금: 1월은 연도('2025년'), 나머지는 'n월' */
export const monthTickLabel = (month: string): string => {
  const [y, m] = month.split('-');
  return m === '01' ? `${y}년` : `${Number(m)}월`;
};
