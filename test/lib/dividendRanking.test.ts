import type { MonthlyDividend } from '../../src/api/types';
import { rankDividends } from '../../src/lib/dividendRanking';
import { dividendItem } from '../fixtures';

const summary = {
  krwAmount: '0',
  usdAmount: '0',
  usdKrwAmount: '0',
  totalKrwAmount: '0',
  afterTaxKrwAmount: '0',
  afterTaxUsdAmount: '0',
  afterTaxUsdKrwAmount: '0',
  afterTaxTotalKrwAmount: '0',
};

const usdItem = (overrides = {}) =>
  dividendItem({
    securityId: 'US7561091049',
    name: '리얼티 인컴',
    currency: 'USD',
    perShareAmount: '0.32',
    amount: '64.000000',
    usdAmount: '64.000000',
    krwAmount: '87350',
    taxAmount: '9.600000',
    afterTaxAmount: '54.400000',
    afterTaxUsdAmount: '54.400000',
    afterTaxKrwAmount: '74247',
    exchangeRate: '1364.84',
    exchangeRateDate: '2026-04-15',
    ...overrides,
  });

const months: MonthlyDividend[] = [
  { month: '2026-04', summary, items: [dividendItem(), usdItem()] },
  {
    month: '2026-05',
    summary,
    items: [dividendItem({ paymentDate: '2026-05-20', amount: '10000', krwAmount: '10000', afterTaxAmount: '8460', afterTaxKrwAmount: '8460' })],
  },
];

describe('rankDividends', () => {
  it('종목별로 합쳐 원화 합이 큰 순서로 정렬하고 지급 횟수와 비중을 계산한다', () => {
    const result = rankDividends(months, 'pre');
    expect(result.map((r) => r.name)).toEqual(['리얼티 인컴', '삼성전자']);
    expect(result[0]).toMatchObject({ count: 1, amount: 64, krwAmount: 87350, currency: 'USD' });
    expect(result[1]).toMatchObject({ count: 2, amount: 46100, krwAmount: 46100, currency: 'KRW' });
    // 87,350 / 133,450 = 65.4552…%, 46,100 / 133,450 = 34.5447…% (소수 2자리 버림)
    expect(result[0].share).toBe(65.45);
    expect(result[1].share).toBe(34.54);
  });

  it('세후는 세후 금액으로 합산한다', () => {
    const result = rankDividends(months, 'after');
    expect(result[0]).toMatchObject({ name: '리얼티 인컴', amount: 54.4, krwAmount: 74247 });
    expect(result[1]).toMatchObject({ name: '삼성전자', amount: 39001, krwAmount: 39001 });
  });

  it('지급일 환율이 없는 건은 원화 합에서 빠지고 종목 통화 합에는 들어간다', () => {
    const result = rankDividends(
      [{ month: '2026-04', summary, items: [usdItem({ krwAmount: null }), usdItem()] }],
      'pre',
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ count: 2, amount: 128, krwAmount: 87350, share: 100 });
  });

  it('원화 합이 같으면 이름순, 전체가 0이면 비중은 0', () => {
    const zero = { amount: '0', krwAmount: '0' };
    const result = rankDividends(
      [
        {
          month: '2026-04',
          summary,
          items: [dividendItem({ securityId: 'B', name: '하나', ...zero }), dividendItem({ securityId: 'A', name: '가나', ...zero })],
        },
      ],
      'pre',
    );
    expect(result.map((r) => r.name)).toEqual(['가나', '하나']);
    expect(result.every((r) => r.share === 0)).toBe(true);
  });

  it('지급분이 없으면 빈 배열', () => {
    expect(rankDividends([], 'pre')).toEqual([]);
  });
});
