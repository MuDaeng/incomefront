import type { Currency, MonthlyDividend } from '../api/types';
import { dividendItemView, type TaxMode } from './dividendTax';
import { toNumber } from './format';

/** 배당금 순위 한 줄: 기간 안에 지급받은 한 종목의 배당 합계 */
export interface DividendRankItem {
  securityId: string;
  name: string;
  currency: Currency;
  /** 지급 횟수 */
  count: number;
  /** 배당금 합 (종목 통화) */
  amount: number;
  /** 원화 환산 합. 지급일 환율이 없는 건은 빠진다 */
  krwAmount: number;
  /** 원화 기준 전체 대비 비중 (%, 소수 2자리 버림). 전체가 0이면 0 */
  share: number;
}

/**
 * 월별 지급분(지급 예정 제외)을 종목별로 합쳐 원화 합이 큰 순서로 정렬한다 (같으면 이름순).
 * 세전/세후는 dividendItemView 기준을 따른다. 표시용 계산이라 number로 더한다.
 */
export function rankDividends(months: MonthlyDividend[], taxMode: TaxMode): DividendRankItem[] {
  const bySecurity = new Map<string, DividendRankItem>();
  for (const month of months) {
    for (const item of month.items) {
      const view = dividendItemView(item, taxMode);
      const row =
        bySecurity.get(item.securityId) ??
        ({
          securityId: item.securityId,
          name: item.name,
          currency: item.currency,
          count: 0,
          amount: 0,
          krwAmount: 0,
          share: 0,
        } as DividendRankItem);
      row.count += 1;
      row.amount += toNumber(view.amount);
      if (view.krwAmount != null) row.krwAmount += toNumber(view.krwAmount);
      bySecurity.set(item.securityId, row);
    }
  }
  const rows = Array.from(bySecurity.values());
  const total = rows.reduce((sum, r) => sum + r.krwAmount, 0);
  for (const r of rows) r.share = total > 0 ? Math.trunc((r.krwAmount / total) * 10000) / 100 : 0;
  return rows.sort((a, b) => b.krwAmount - a.krwAmount || a.name.localeCompare(b.name, 'ko'));
}
