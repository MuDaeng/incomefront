import type { DividendMetricsItem, MonthlyBalanceItem } from '../../src/api/types';
import {
  dividendRecoveryItems,
  formatRecoveryPeriod,
  recoveryMonth,
  recoveryMonths,
} from '../../src/lib/dividendRecovery';

const monthly = (o: Partial<MonthlyBalanceItem> & Pick<MonthlyBalanceItem, 'securityId'>): MonthlyBalanceItem => ({
  name: o.securityId,
  currency: 'KRW',
  quantity: '10',
  purchaseAmount: '100000',
  evaluationAmount: '80000',
  dividendAmount: '5000',
  totalAmount: '85000',
  ...o,
});

const metrics = (securityId: string, krwAnnualDividend: string): DividendMetricsItem => ({
  securityId,
  symbol: `SYM-${securityId}`,
  name: `이름-${securityId}`,
  currency: 'KRW',
  quantity: '10',
  trailingPerShare: '0',
  paymentCount: 0,
  previousPerShare: '0',
  previousPaymentCount: 0,
  growthRate: null,
  growthBasis: 'TOTAL',
  annualDividend: krwAnnualDividend,
  krwAnnualDividend,
  krwPurchaseAmount: '100000',
  closingPrice: null,
  priceDate: null,
  krwEvaluationAmount: null,
  yieldOnCost: null,
  currentYield: null,
});

describe('recoveryMonths', () => {
  it('손실 ÷ 연배당 × 12를 올림한다', () => {
    expect(recoveryMonths(15000, 6000)).toBe(30);
    expect(recoveryMonths(10000, 1190)).toBe(101);
  });

  it('연배당이 없으면 null, 손실이 없으면 0', () => {
    expect(recoveryMonths(1000, 0)).toBeNull();
    expect(recoveryMonths(1000, NaN)).toBeNull();
    expect(recoveryMonths(0, 1000)).toBe(0);
  });
});

describe('dividendRecoveryItems', () => {
  it('손실 중인 보유 종목만, 회복 기간 짧은 순으로, 배당 없는 종목은 맨 뒤', () => {
    const items = dividendRecoveryItems(
      [
        monthly({ securityId: 'A' }), // 손실 15,000 / 연 6,000 → 30개월
        monthly({ securityId: 'B', totalAmount: '99000' }), // 손실 1,000 / 연 6,000 → 2개월
        monthly({ securityId: 'C', totalAmount: '120000' }), // 이익 → 제외
        monthly({ securityId: 'D', quantity: '0' }), // 매도 후 배당만 → 제외
        monthly({ securityId: 'E' }), // 배당 없음 → null
        monthly({ securityId: 'F' }), // 지표 없음 → 제외
      ],
      [metrics('A', '6000'), metrics('B', '6000'), metrics('C', '6000'), metrics('D', '6000'), metrics('E', '0')],
    );
    expect(items.map((i) => [i.securityId, i.months])).toEqual([
      ['B', 2],
      ['A', 30],
      ['E', null],
    ]);
    expect(items[1]).toMatchObject({ symbol: 'SYM-A', loss: 15000, purchaseAmount: 100000, totalAmount: 85000 });
  });
});

describe('formatRecoveryPeriod', () => {
  it.each([
    [null, '회복 불가'],
    [0, '1개월 이내'],
    [1, '1개월 이내'],
    [8, '약 8개월'],
    [24, '약 2년'],
    [27, '약 2년 3개월'],
  ])('%s개월 → %s', (months, text) => {
    expect(formatRecoveryPeriod(months)).toBe(text);
  });
});

describe('recoveryMonth', () => {
  it('오늘부터 n개월 뒤 년월', () => {
    expect(recoveryMonth(30, '2026-11-22')).toBe('2029-05');
    expect(recoveryMonth(null, '2026-11-22')).toBeNull();
  });
});
