import { fireEvent, screen } from '@testing-library/react';
import { DividendsPage } from '../../src/pages/DividendsPage';
import {
  accountList,
  currentMonthBalance,
  dividendHistory,
  dividendItem,
  dividendMetrics,
  scheduledDividends,
} from '../fixtures';
import { apiError, mockApi, renderPage, requestCalls } from '../testUtils';

jest.mock('../../src/api/client', () => ({ ...jest.requireActual('../../src/api/client'), request: jest.fn() }));

const setup = (history = dividendHistory()) => {
  mockApi({
    'GET /balance/dividends': history,
    'GET /accounts': accountList(),
    'GET /balance/dividend-metrics': dividendMetrics(),
  });
  return renderPage(<DividendsPage />, { route: '/dividends' });
};

beforeEach(() => localStorage.clear());

describe('DividendsPage', () => {
  it('세후를 누르면 금액이 세후로 바뀌고 세금 열이 생긴다', async () => {
    setup();
    expect(await screen.findByText('총 배당금 (세전)')).toBeInTheDocument();
    expect(screen.getAllByText('123,450원').length).toBeGreaterThan(0);
    expect(screen.queryByRole('columnheader', { name: '세금' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '세후' }));

    expect(screen.getByText('총 배당금 (세후)')).toBeInTheDocument();
    expect(screen.getAllByText('104,430원').length).toBeGreaterThan(0);
    expect(screen.queryByText('123,450원')).toBeNull();
    expect(screen.getByRole('columnheader', { name: '세금' })).toBeInTheDocument();
    expect(screen.getByText('5,559원')).toBeInTheDocument(); // 행의 세금
  });

  it('세전/세후 선택이 남아 다시 열어도 세후다', async () => {
    const { unmount } = setup();
    fireEvent.click(await screen.findByRole('button', { name: '세후' }));
    unmount();

    setup();
    expect(await screen.findByText('총 배당금 (세후)')).toBeInTheDocument();
  });

  it('지급 예정 배당이 있을 때만 지급 예정 카드를 보여준다', async () => {
    const { unmount } = setup();
    expect(await screen.findByText('총 배당금 (세전)')).toBeInTheDocument();
    expect(screen.queryByText(/^지급 예정 \d+건/)).toBeNull();
    unmount();

    setup(dividendHistory({ scheduled: scheduledDividends() }));
    expect(await screen.findByText('지급 예정 1건 · 9,870원')).toBeInTheDocument();
    expect(screen.getByText('SK하이닉스')).toBeInTheDocument();
  });

  it('지급분 없이 예정분만 있으면 빈 화면 안내 없이 지급 예정 카드만 보여준다', async () => {
    setup(dividendHistory({ months: [], scheduled: scheduledDividends() }));
    expect(await screen.findByText('지급 예정 1건 · 9,870원')).toBeInTheDocument();
    expect(screen.queryByText('이 기간에 받은 배당금이 없어요')).toBeNull();
  });

  it('지급분도 예정분도 없으면 빈 화면 안내를 보여준다', async () => {
    setup(dividendHistory({ months: [] }));
    expect(await screen.findByText('이 기간에 받은 배당금이 없어요')).toBeInTheDocument();
  });

  it('URL의 계좌 필터를 요청에 넣는다', async () => {
    mockApi({
      'GET /balance/dividends': dividendHistory(),
      'GET /accounts': accountList(),
      'GET /balance/dividend-metrics': dividendMetrics(),
    });
    renderPage(<DividendsPage />, { route: '/dividends?accountId=2&tab=metrics' });
    expect(await screen.findByText('총 배당금 (세전)')).toBeInTheDocument();
    expect(requestCalls('GET', '/balance/dividends').at(-1)?.query?.accountId).toBe(2);
    expect(await screen.findByText('현재 보유 종목이 없어요')).toBeInTheDocument();
    expect(requestCalls('GET', '/balance/dividend-metrics').at(-1)?.query?.accountId).toBe(2);
  });

  it('처음에는 월별 내역 탭만 보이고, 배당 지표는 탭을 눌러야 조회한다', async () => {
    setup();
    expect(await screen.findByText('월별 배당금')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '월별 내역' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('현재 보유 종목이 없어요')).toBeNull();
    expect(requestCalls('GET', '/balance/dividend-metrics')).toHaveLength(0);

    fireEvent.click(screen.getByRole('tab', { name: '배당 지표' }));

    expect(await screen.findByText('현재 보유 종목이 없어요')).toBeInTheDocument();
    expect(screen.queryByText('월별 배당금')).toBeNull();
    expect(requestCalls('GET', '/balance/dividend-metrics')).toHaveLength(1);
  });

  it('배당금 순위 탭은 기간 지급분을 종목별 원화 합이 큰 순서로 보여주고 세후로 바뀐다', async () => {
    const usd = dividendItem({
      securityId: 'US7561091049',
      name: '리얼티 인컴',
      currency: 'USD',
      amount: '64.000000',
      usdAmount: '64.000000',
      krwAmount: '87350',
      taxAmount: '9.600000',
      afterTaxAmount: '54.400000',
      afterTaxUsdAmount: '54.400000',
      afterTaxKrwAmount: '73889',
      exchangeRate: '1364.84',
      exchangeRateDate: '2026-04-15',
    });
    const history = dividendHistory();
    history.months = [{ ...history.months[0], items: [dividendItem(), usd] }];
    setup({ ...history, scheduled: scheduledDividends() });

    fireEvent.click(await screen.findByRole('tab', { name: '배당금 순위' }));

    expect(screen.getByText('배당금 순위 (세전)')).toBeInTheDocument();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2); // 지급 예정(SK하이닉스)은 빠진다
    expect(rows[0]).toHaveTextContent('리얼티 인컴');
    expect(rows[0]).toHaveTextContent('87,350원');
    expect(rows[0]).toHaveTextContent('70.75%');
    expect(rows[1]).toHaveTextContent('삼성전자');
    expect(rows[1]).toHaveTextContent('29.24%');

    fireEvent.click(screen.getByRole('button', { name: '세후' }));

    expect(screen.getByText('배당금 순위 (세후)')).toBeInTheDocument();
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('73,889원');
  });

  it('배당금 순위 탭은 기간 지급분이 없으면 빈 화면 안내를 보여준다', async () => {
    mockApi({
      'GET /balance/dividends': dividendHistory({ months: [], scheduled: scheduledDividends() }),
      'GET /accounts': accountList(),
    });
    renderPage(<DividendsPage />, { route: '/dividends?tab=ranking' });
    expect(await screen.findByText('이 기간에 받은 배당금이 없어요')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '배당금 순위' })).toHaveAttribute('aria-selected', 'true');
  });

  it('평가금액 + 누적 배당금이 원금보다 적은 종목은 배당으로 원금 회복 예상 기간을 보여준다', async () => {
    const metrics = dividendMetrics();
    const metricsItem = (securityId: string, symbol: string, name: string, krwAnnualDividend: string) => ({
      securityId,
      symbol,
      name,
      currency: 'KRW' as const,
      quantity: '10',
      trailingPerShare: '0',
      paymentCount: 4,
      previousPerShare: '0',
      previousPaymentCount: 4,
      growthRate: null,
      growthBasis: 'TOTAL' as const,
      annualDividend: krwAnnualDividend,
      krwAnnualDividend,
      krwPurchaseAmount: '100000',
      closingPrice: null,
      priceDate: null,
      krwEvaluationAmount: null,
      yieldOnCost: null,
      currentYield: null,
    });
    metrics.items = [
      metricsItem('KR7000001111', '000111', '손실종목', '6000'),
      metricsItem('KR7000002222', '000222', '이익종목', '6000'),
    ];
    mockApi({
      'GET /balance/dividends': dividendHistory(),
      'GET /accounts': accountList(),
      'GET /balance/dividend-metrics': metrics,
      'GET /balance/monthly': currentMonthBalance([
        // 손실 15,000 / 연 6,000 → 30개월
        { securityId: 'KR7000001111', name: '손실종목', purchaseAmount: '100000', totalAmount: '85000' },
        { securityId: 'KR7000002222', name: '이익종목', purchaseAmount: '100000', totalAmount: '130000' },
      ]),
    });
    renderPage(<DividendsPage />, { route: '/dividends?accountId=2&tab=metrics' });

    expect(await screen.findByText('배당으로 원금 회복')).toBeInTheDocument();
    expect(screen.getByText('약 2년 6개월')).toBeInTheDocument();
    expect(screen.getByText('-15,000원')).toBeInTheDocument();
    expect(screen.getAllByText('이익종목')).toHaveLength(1); // 배당 지표 표에만
    expect(requestCalls('GET', '/balance/monthly').at(-1)?.query?.accountId).toBe(2);
  });

  const heldMetrics = () => {
    const metrics = dividendMetrics();
    metrics.items = [
      {
        securityId: 'KR7000002222',
        symbol: '000222',
        name: '이익종목',
        currency: 'KRW',
        quantity: '10',
        trailingPerShare: '600',
        paymentCount: 4,
        previousPerShare: '600',
        previousPaymentCount: 4,
        growthRate: null,
        growthBasis: 'TOTAL',
        annualDividend: '6000',
        krwAnnualDividend: '6000',
        krwPurchaseAmount: '100000',
        closingPrice: null,
        priceDate: null,
        krwEvaluationAmount: null,
        yieldOnCost: null,
        currentYield: null,
      },
    ];
    return metrics;
  };

  it('배당 포함 손실 종목이 없으면 원금 회복 카드에 안내 문구를 보여준다', async () => {
    mockApi({
      'GET /balance/dividends': dividendHistory(),
      'GET /accounts': accountList(),
      'GET /balance/dividend-metrics': heldMetrics(),
      'GET /balance/monthly': currentMonthBalance([
        { securityId: 'KR7000002222', name: '이익종목', purchaseAmount: '100000', totalAmount: '130000' },
      ]),
    });
    renderPage(<DividendsPage />, { route: '/dividends?tab=metrics' });
    expect(await screen.findByText('배당 포함 손실 중인 종목이 없어요')).toBeInTheDocument();
  });

  it('월별 잔고 조회가 실패하면 원금 회복 카드에 오류를 보여준다', async () => {
    mockApi({
      'GET /balance/dividends': dividendHistory(),
      'GET /accounts': accountList(),
      'GET /balance/dividend-metrics': heldMetrics(),
      'GET /balance/monthly': apiError(500, '월별 잔고 조회 실패'),
    });
    renderPage(<DividendsPage />, { route: '/dividends?tab=metrics' });
    expect(await screen.findByText('배당으로 원금 회복')).toBeInTheDocument();
    expect(await screen.findByText('월별 잔고 조회 실패')).toBeInTheDocument();
  });
});
