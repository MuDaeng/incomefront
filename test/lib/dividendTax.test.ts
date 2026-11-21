import type { DividendItem, DividendSummary, TotalReturnSummary } from '../../src/api/types';
import {
  dividendItemView,
  dividendSumView,
  dividendSummaryView,
  krwTaxAmount,
  totalReturnView,
} from '../../src/lib/dividendTax';

const summary: DividendSummary = {
  krwAmount: '10000',
  usdAmount: '10.000000',
  usdKrwAmount: '13500',
  totalKrwAmount: '23500',
  afterTaxKrwAmount: '8460',
  afterTaxUsdAmount: '8.500000',
  afterTaxUsdKrwAmount: '11475',
  afterTaxTotalKrwAmount: '19935',
};

describe('dividendTax', () => {
  it('배당 합계: 세전·세후 필드를 고른다', () => {
    expect(dividendSummaryView(summary, 'pre')).toEqual({
      krwAmount: '10000',
      usdAmount: '10.000000',
      usdKrwAmount: '13500',
      totalKrwAmount: '23500',
    });
    expect(dividendSummaryView(summary, 'after')).toEqual({
      krwAmount: '8460',
      usdAmount: '8.500000',
      usdKrwAmount: '11475',
      totalKrwAmount: '19935',
    });
  });

  it('원화 세금 합계 = 세전 − 세후', () => {
    expect(krwTaxAmount(summary)).toBe(3565);
    expect(krwTaxAmount({ ...summary, afterTaxTotalKrwAmount: '23500' })).toBe(0);
  });

  it('배당 한 건: 세후는 세금 뺀 금액, 환율 없으면 원화 null 유지', () => {
    const item = {
      amount: '10.000000',
      usdAmount: '10.000000',
      krwAmount: null,
      taxAmount: '1.500000',
      afterTaxAmount: '8.500000',
      afterTaxUsdAmount: '8.500000',
      afterTaxKrwAmount: null,
    } as DividendItem;
    expect(dividendItemView(item, 'pre')).toEqual({ amount: '10.000000', usdAmount: '10.000000', krwAmount: null });
    expect(dividendItemView(item, 'after')).toEqual({ amount: '8.500000', usdAmount: '8.500000', krwAmount: null });
  });

  it('기간 수익률: 배당·총액·수익금·수익률만 세후로', () => {
    const t: TotalReturnSummary = {
      purchaseAmount: '100000',
      evaluationAmount: '110000',
      dividendAmount: '1000',
      totalAmount: '111000',
      profit: '11000',
      returnRate: '11.00',
      afterTaxDividendAmount: '846',
      afterTaxTotalAmount: '110846',
      afterTaxProfit: '10846',
      afterTaxReturnRate: '10.84',
    };
    expect(totalReturnView(t, 'pre')).toEqual({
      dividendAmount: '1000',
      totalAmount: '111000',
      profit: '11000',
      returnRate: '11.00',
    });
    expect(totalReturnView(t, 'after')).toEqual({
      dividendAmount: '846',
      totalAmount: '110846',
      profit: '10846',
      returnRate: '10.84',
    });
    const sum = { usdAmount: '2.000000', krwAmount: '2700', afterTaxUsdAmount: '1.700000', afterTaxKrwAmount: '2295' };
    expect(dividendSumView(sum, 'after')).toEqual({ usdAmount: '1.700000', krwAmount: '2295' });
    expect(dividendSumView(sum, 'pre')).toEqual({ usdAmount: '2.000000', krwAmount: '2700' });
  });
});
