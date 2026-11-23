/**
 * 페이지 테스트용 백엔드 응답 생성 함수. 실제 DTO 모양(src/api/types.ts)을 따르고,
 * 테스트마다 필요한 값만 덮어쓴다. 금액은 화면에서 서로 헷갈리지 않게 겹치지 않는 값을 쓴다.
 */
import type {
  Account,
  DividendHistoryResponse,
  DividendItem,
  DividendMetricsResponse,
  DividendSummary,
  IntegratedBalanceResponse,
  MonthlyBalanceItem,
  MonthlyBalanceResponse,
  PeriodReturnResponse,
  PurchaseHistoryResponse,
} from '../src/api/types';

export const accounts: Account[] = [
  { id: 1, securityCompany: 'TOSS', accountType: 'NORMAL' },
  { id: 2, securityCompany: 'KIWOOM', accountType: 'ISA' },
];

export const accountList = (list: Account[] = accounts) => ({ accounts: list });

const emptySummary: DividendSummary = {
  krwAmount: '0',
  usdAmount: '0',
  usdKrwAmount: '0',
  totalKrwAmount: '0',
  afterTaxKrwAmount: '0',
  afterTaxUsdAmount: '0',
  afterTaxUsdKrwAmount: '0',
  afterTaxTotalKrwAmount: '0',
};

export const dividendItem = (overrides: Partial<DividendItem> = {}): DividendItem => ({
  securityId: 'KR7005930003',
  name: '삼성전자',
  currency: 'KRW',
  noticeDate: '2026-03-31',
  exDividendDate: '2026-03-30',
  paymentDate: '2026-04-20',
  perShareAmount: '361',
  quantity: '100',
  amount: '36100',
  usdAmount: null,
  krwAmount: '36100',
  taxAmount: '5559',
  afterTaxAmount: '30541',
  afterTaxUsdAmount: null,
  afterTaxKrwAmount: '30541',
  exchangeRate: null,
  exchangeRateDate: null,
  ...overrides,
});

/** 세전 총 123,450원 / 세후 104,430원, 지급 예정 없음 */
export const dividendHistory = (overrides: Partial<DividendHistoryResponse> = {}): DividendHistoryResponse => ({
  from: '2026-01-01',
  to: '2026-12-31',
  total: {
    krwAmount: '36100',
    usdAmount: '64.000000',
    usdKrwAmount: '87350',
    totalKrwAmount: '123450',
    afterTaxKrwAmount: '30541',
    afterTaxUsdAmount: '54.400000',
    afterTaxUsdKrwAmount: '73889',
    afterTaxTotalKrwAmount: '104430',
  },
  months: [
    {
      month: '2026-04',
      summary: {
        krwAmount: '36100',
        usdAmount: '64.000000',
        usdKrwAmount: '87350',
        totalKrwAmount: '123450',
        afterTaxKrwAmount: '30541',
        afterTaxUsdAmount: '54.400000',
        afterTaxUsdKrwAmount: '73889',
        afterTaxTotalKrwAmount: '104430',
      },
      items: [dividendItem()],
    },
  ],
  scheduled: { total: emptySummary, items: [] },
  ...overrides,
});

/** 지급 예정 배당 1건 (세전 9,870원) */
export const scheduledDividends = () => ({
  total: {
    ...emptySummary,
    krwAmount: '9870',
    totalKrwAmount: '9870',
    afterTaxKrwAmount: '8350',
    afterTaxTotalKrwAmount: '8350',
  },
  items: [
    dividendItem({
      securityId: 'KR7000660001',
      name: 'SK하이닉스',
      paymentDate: '2099-01-20',
      amount: '9870',
      krwAmount: '9870',
      taxAmount: '1520',
      afterTaxAmount: '8350',
      afterTaxKrwAmount: '8350',
    }),
  ],
});

export const dividendMetrics = (): DividendMetricsResponse => ({
  date: '2026-11-22',
  exchangeRate: null,
  exchangeRateDate: null,
  items: [],
  total: {
    krwAnnualDividend: '0',
    krwPurchaseAmount: '0',
    krwEvaluationAmount: '0',
    yieldOnCost: null,
    currentYield: null,
  },
});

export const monthlyBalance = (): MonthlyBalanceResponse => ({ from: '2026-01', to: '2026-11', months: [] });

/** 원금 100,000 · 기준금액 105,000 · 평가 110,000 → 평가손익 +5,000(+4.76%), 총수익 세전 +16,000원(+15.23%) / 세후 +14,500원(+13.80%) */
export const periodReturn = (overrides: Partial<PeriodReturnResponse> = {}): PeriodReturnResponse => ({
  from: '2026-01-01',
  to: '2026-11-22',
  exchangeRate: null,
  exchangeRateDate: null,
  startExchangeRate: null,
  startExchangeRateDate: null,
  evaluation: {
    items: [
      {
        securityId: 'KR7005930003',
        name: '삼성전자',
        currency: 'KRW',
        quantity: '10',
        startClosingPrice: '10500',
        startPriceDate: '2025-12-31',
        closingPrice: '11000',
        priceDate: '2026-11-21',
        usdPurchaseAmount: null,
        usdBaseAmount: null,
        usdEvaluationAmount: null,
        krwPurchaseAmount: '100000',
        krwBaseAmount: '105000',
        krwEvaluationAmount: '110000',
        profit: '5000',
        returnRate: '4.76',
      },
    ],
    total: {
      purchaseAmount: '100000',
      baseAmount: '105000',
      evaluationAmount: '110000',
      profit: '5000',
      returnRate: '4.76',
    },
  },
  dividend: {
    items: [
      {
        securityId: 'KR7005930003',
        name: '삼성전자',
        currency: 'KRW',
        usdAmount: null,
        krwAmount: '11000',
        afterTaxUsdAmount: null,
        afterTaxKrwAmount: '9500',
      },
    ],
    total: { usdAmount: '0', krwAmount: '11000', afterTaxUsdAmount: '0', afterTaxKrwAmount: '9500' },
  },
  total: {
    items: [
      {
        securityId: 'KR7005930003',
        name: '삼성전자',
        purchaseAmount: '100000',
        baseAmount: '105000',
        evaluationAmount: '110000',
        dividendAmount: '11000',
        totalAmount: '121000',
        profit: '16000',
        returnRate: '15.23',
        afterTaxDividendAmount: '9500',
        afterTaxTotalAmount: '119500',
        afterTaxProfit: '14500',
        afterTaxReturnRate: '13.80',
      },
    ],
    total: {
      purchaseAmount: '100000',
      baseAmount: '105000',
      evaluationAmount: '110000',
      dividendAmount: '11000',
      totalAmount: '121000',
      profit: '16000',
      returnRate: '15.23',
      afterTaxDividendAmount: '9500',
      afterTaxTotalAmount: '119500',
      afterTaxProfit: '14500',
      afterTaxReturnRate: '13.80',
    },
  },
  ...overrides,
});

export const integratedBalance = (
  overrides: Partial<IntegratedBalanceResponse> = {},
): IntegratedBalanceResponse => ({
  items: [
    {
      securityId: 'KR7005930003',
      symbol: '005930',
      name: '삼성전자',
      currency: 'KRW',
      amount: '5',
      accountAmounts: [
        { accountId: 1, securityCompany: 'TOSS', accountType: 'NORMAL', amount: '3' },
        { accountId: 2, securityCompany: 'KIWOOM', accountType: 'ISA', amount: '2' },
      ],
      currentPrice: '71000',
      krwAveragePrice: '70000',
      usdAveragePrice: null,
      krwPurchaseAmount: '350000',
      usdPurchaseAmount: null,
      krwEvaluationAmount: '355000',
      usdEvaluationAmount: null,
      returnRate: '1.42',
    },
  ],
  krwTotal: { purchaseAmount: '350000', evaluationAmount: '355000', returnRate: '1.42' },
  usdTotal: {
    usdPurchaseAmount: '0',
    usdEvaluationAmount: '0',
    krwPurchaseAmount: '0',
    krwEvaluationAmount: '0',
    returnRate: '0.00',
  },
  total: { purchaseAmount: '350000', evaluationAmount: '355000', returnRate: '1.42' },
  exchangeRate: null,
  exchangeRateDate: null,
  ...overrides,
});

export const purchases = (overrides: Partial<PurchaseHistoryResponse> = {}): PurchaseHistoryResponse => ({
  security: { id: 'KR7005930003', symbol: '005930', name: '삼성전자', currency: 'KRW' },
  amount: '5',
  accountAmounts: [
    { accountId: 1, securityCompany: 'TOSS', accountType: 'NORMAL', amount: '3' },
    { accountId: 2, securityCompany: 'KIWOOM', accountType: 'ISA', amount: '2' },
  ],
  items: [
    {
      purchaseDate: '2026-02-03',
      sequence: 1,
      accountId: 1,
      securityCompany: 'TOSS',
      accountType: 'NORMAL',
      amount: '3',
      price: '70000',
      saleDate: null,
      exchangeRate: null,
      exchangeRateDate: null,
    },
    {
      purchaseDate: '2026-03-04',
      sequence: 1,
      accountId: 2,
      securityCompany: 'KIWOOM',
      accountType: 'ISA',
      amount: '2',
      price: '70000',
      saleDate: null,
      exchangeRate: null,
      exchangeRateDate: null,
    },
  ],
  ...overrides,
});

/** GET /balance/monthly 이번 달 한 달치 (원금·평가금액·누적배당금은 항목 합) */
export const currentMonthBalance = (
  items: Array<Partial<MonthlyBalanceItem> & Pick<MonthlyBalanceItem, 'securityId' | 'name'>>,
  month = '2026-11',
): MonthlyBalanceResponse => {
  const full: MonthlyBalanceItem[] = items.map((i) => ({
    currency: 'KRW',
    quantity: '1',
    purchaseAmount: '0',
    evaluationAmount: '0',
    dividendAmount: '0',
    totalAmount: '0',
    ...i,
  }));
  const sum = (key: 'purchaseAmount' | 'evaluationAmount' | 'dividendAmount' | 'totalAmount') =>
    String(full.reduce((acc, i) => acc + Number(i[key]), 0));
  return {
    from: month,
    to: month,
    months: [
      {
        month,
        date: `${month}-22`,
        total: {
          purchaseAmount: sum('purchaseAmount'),
          evaluationAmount: sum('evaluationAmount'),
          dividendAmount: sum('dividendAmount'),
          totalAmount: sum('totalAmount'),
        },
        items: full,
      },
    ],
  };
};
