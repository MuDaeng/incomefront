import type { DividendMetricsItem, DividendMetricsResponse } from '../../src/api/types';
import {
  findMetricsItem,
  growthBasisNote,
  monthlyAverage,
  payingCount,
  sortByAnnualDividend,
} from '../../src/lib/dividendMetrics';
import { formatPercent } from '../../src/lib/format';

const item = (securityId: string, krwAnnualDividend: string): DividendMetricsItem => ({
  securityId,
  symbol: securityId,
  name: securityId,
  currency: 'KRW',
  quantity: '1',
  trailingPerShare: '0',
  paymentCount: 0,
  previousPerShare: '0',
  previousPaymentCount: 0,
  growthRate: null,
  growthBasis: 'TOTAL',
  annualDividend: krwAnnualDividend,
  krwAnnualDividend,
  krwPurchaseAmount: '1000',
  closingPrice: null,
  priceDate: null,
  krwEvaluationAmount: null,
  yieldOnCost: null,
  currentYield: null,
});

describe('dividendMetrics', () => {
  it('monthlyAverage는 연배당 ÷ 12, 값이 없으면 NaN', () => {
    expect(monthlyAverage('120000')).toBe(10000);
    expect(monthlyAverage(null)).toBeNaN();
  });

  it('sortByAnnualDividend는 원화 연배당 내림차순이고 원본을 바꾸지 않는다', () => {
    const items = [item('A', '100'), item('B', '300'), item('C', '0'), item('D', '300')];
    expect(sortByAnnualDividend(items).map((i) => i.securityId)).toEqual(['B', 'D', 'A', 'C']);
    expect(items.map((i) => i.securityId)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('findMetricsItem은 종목 하나를 찾고 없으면 null', () => {
    const data = { items: [item('A', '1')] } as DividendMetricsResponse;
    expect(findMetricsItem(data, 'A')?.securityId).toBe('A');
    expect(findMetricsItem(data, 'B')).toBeNull();
    expect(findMetricsItem(undefined, 'A')).toBeNull();
  });

  it('payingCount는 연배당이 있는 종목 수', () => {
    expect(payingCount([item('A', '0'), item('B', '10'), item('C', '5')])).toBe(2);
  });

  it('formatPercent는 부호 없이 소수 2자리, 값이 없으면 -', () => {
    expect(formatPercent('3.2')).toBe('3.20%');
    expect(formatPercent(null)).toBe('-');
  });
});

describe('growthBasisNote', () => {
  const growth = { trailingPerShare: '238', paymentCount: 12, previousPerShare: '130', previousPaymentCount: 7 };

  it('회당 평균으로 비교했으면 상장 1년 미만과 두 평균을 보여준다', () => {
    expect(growthBasisNote({ ...growth, growthBasis: 'PER_PAYMENT' }, 'KRW')).toBe(
      '상장 1년 미만 · 회당 평균 18.57원 → 19.83원',
    );
  });

  it('합으로 비교했거나 방식이 없으면(배포 전 백엔드) 직전 12개월 합을 보여준다', () => {
    expect(growthBasisNote({ ...growth, growthBasis: 'TOTAL' }, 'KRW')).toBe('직전 12개월 130원');
    const legacy = { ...growth, growthBasis: undefined } as unknown as Parameters<typeof growthBasisNote>[0];
    expect(growthBasisNote(legacy, 'USD')).toBe('직전 12개월 $130.00');
  });
});
