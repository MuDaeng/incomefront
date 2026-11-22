import dayjs from 'dayjs';
import type { Currency, DividendMetricsItem, MonthlyBalanceItem } from '../api/types';
import { toNumber } from './format';

/** 배당으로 원금 회복 예상 (현재 보유 중이고 평가금액 + 누적배당금 < 원금인 종목) */
export interface DividendRecoveryItem {
  securityId: string;
  symbol: string;
  name: string;
  currency: Currency;
  /** 원금 (현재 보유분, 원화) */
  purchaseAmount: number;
  /** 평가금액 + 누적배당금 (원화) */
  totalAmount: number;
  /** 원금 − (평가금액 + 누적배당금), 항상 > 0 */
  loss: number;
  /** 예상 연배당 (원화, 세전) */
  krwAnnualDividend: number;
  /** 회복까지 개월 수 (올림). 예상 연배당이 0이면 null */
  months: number | null;
}

/** 손실 ÷ 예상 연배당 × 12 를 올림한 개월 수. 연배당이 없으면 null */
export const recoveryMonths = (loss: number, annualDividend: number): number | null => {
  if (!(annualDividend > 0) || !Number.isFinite(loss)) return null;
  if (loss <= 0) return 0;
  return Math.ceil((loss / annualDividend) * 12);
};

/**
 * 이번 달 월별 잔고(원금·평가금액·누적배당금)와 배당 지표(예상 연배당)를 종목별로 합쳐,
 * 손실 중인 보유 종목의 원금 회복 예상을 만든다. 회복 기간이 짧은 순, 회복 불가(배당 없음)는 맨 뒤.
 */
export function dividendRecoveryItems(
  monthlyItems: MonthlyBalanceItem[],
  metricsItems: DividendMetricsItem[],
): DividendRecoveryItem[] {
  const metricsById = new Map(metricsItems.map((m) => [m.securityId, m]));
  const result: DividendRecoveryItem[] = [];
  for (const item of monthlyItems) {
    if (!(toNumber(item.quantity) > 0)) continue;
    const metrics = metricsById.get(item.securityId);
    if (!metrics) continue;
    const purchaseAmount = toNumber(item.purchaseAmount);
    const totalAmount = toNumber(item.totalAmount);
    const loss = purchaseAmount - totalAmount;
    if (!(loss > 0)) continue;
    const krwAnnualDividend = toNumber(metrics.krwAnnualDividend) || 0;
    result.push({
      securityId: item.securityId,
      symbol: metrics.symbol,
      name: metrics.name || item.name,
      currency: item.currency,
      purchaseAmount,
      totalAmount,
      loss,
      krwAnnualDividend,
      months: recoveryMonths(loss, krwAnnualDividend),
    });
  }
  return result.sort((a, b) => (a.months ?? Infinity) - (b.months ?? Infinity));
}

/** "1개월 이내" / "약 8개월" / "약 2년" / "약 2년 3개월" / "회복 불가" */
export function formatRecoveryPeriod(months: number | null): string {
  if (months === null) return '회복 불가';
  if (months <= 1) return '1개월 이내';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `약 ${rest}개월`;
  return rest === 0 ? `약 ${years}년` : `약 ${years}년 ${rest}개월`;
}

/** 회복 예상 년월 'YYYY-MM' (today 기준 months개월 뒤). 회복 불가면 null */
export const recoveryMonth = (months: number | null, today: string): string | null =>
  months === null ? null : dayjs(today).add(months, 'month').format('YYYY-MM');
