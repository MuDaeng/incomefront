import dayjs from 'dayjs';
import { toNumber } from './format';

/** 월별 추이 기간 프리셋 (짧은 기간부터). 백엔드 최대 120개월 */
export const MONTH_PRESETS = [
  { key: '6M', label: '6개월', months: 6 },
  { key: '1Y', label: '1년', months: 12 },
  { key: '3Y', label: '3년', months: 36 },
  { key: '5Y', label: '5년', months: 60 },
] as const;

export type MonthPresetKey = (typeof MONTH_PRESETS)[number]['key'];

/**
 * 이번 달까지 최근 months개월의 년월 범위 ('YYYY-MM').
 * @param today 'YYYY-MM-DD' (기준일, 보통 오늘)
 */
export function monthRange(months: number, today: string): { from: string; to: string } {
  const end = dayjs(today).startOf('month');
  return {
    from: end.subtract(Math.max(1, months) - 1, 'month').format('YYYY-MM'),
    to: end.format('YYYY-MM'),
  };
}

/** 원금 대비 총수익률(%) = (평가금액+누적배당금 − 원금) ÷ 원금 × 100. 원금이 0이면 null */
export function totalReturnRate(
  totalAmount: string | number,
  purchaseAmount: string | number,
): number | null {
  const purchase = toNumber(purchaseAmount);
  const total = toNumber(totalAmount);
  if (!purchase || Number.isNaN(purchase) || Number.isNaN(total)) return null;
  return ((total - purchase) / purchase) * 100;
}
