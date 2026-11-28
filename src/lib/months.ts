import dayjs from 'dayjs';
import { toNumber } from './format';

/** GET /balance/monthly 한 번에 조회할 수 있는 최대 개월 수 (백엔드 MAX_MONTHS) */
export const MAX_MONTHS = 120;

export interface MonthRange {
  /** 'YYYY-MM' */
  from: string;
  /** 'YYYY-MM' */
  to: string;
  /** to가 이번 달로 줄었는지 */
  cappedToCurrentMonth: boolean;
  /** 최대 개월 수를 넘어 from을 당겼는지 */
  cappedToMaxMonths: boolean;
}

/**
 * 기간 수익률의 날짜 범위('YYYY-MM-DD')를 월별 추이 API용 년월 범위로 바꾼다.
 * - to는 이번 달까지로 줄인다 (백엔드는 미래 달을 400으로 거부)
 * - 120개월을 넘으면 to 기준 최근 120개월로 from을 당긴다
 * - from이 없으면(전체 = 처음부터) to 기준 최근 120개월 (첫 매수 전 빈 달은 trimLeadingEmptyMonths로 자른다)
 * - 그래도 from > to(시작이 미래)면 조회할 달이 없으므로 null
 * @param today 'YYYY-MM-DD'
 */
export function monthsForDateRange(
  from: string | undefined,
  to: string,
  today: string,
): MonthRange | null {
  const currentMonth = today.slice(0, 7);
  let toMonth = to.slice(0, 7);

  const cappedToCurrentMonth = toMonth > currentMonth;
  if (cappedToCurrentMonth) toMonth = currentMonth;

  const earliest = dayjs(`${toMonth}-01`)
    .subtract(MAX_MONTHS - 1, 'month')
    .format('YYYY-MM');
  let fromMonth = from ? from.slice(0, 7) : earliest;
  if (fromMonth > toMonth) return null;

  const cappedToMaxMonths = !from || fromMonth < earliest;
  if (cappedToMaxMonths) fromMonth = earliest;

  return { from: fromMonth, to: toMonth, cappedToCurrentMonth, cappedToMaxMonths };
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

/** 앞쪽의 빈 달(보유·배당 종목이 없는 달, 첫 매수 전)을 잘라낸다. 중간·뒤쪽 빈 달은 그대로 둔다 */
export function trimLeadingEmptyMonths<T extends { items: unknown[] }>(months: T[]): T[] {
  const first = months.findIndex((m) => m.items.length > 0);
  return first === -1 ? [] : months.slice(first);
}
