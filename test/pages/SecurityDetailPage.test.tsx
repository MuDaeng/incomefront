import { fireEvent, screen, waitFor } from '@testing-library/react';
import { SecurityDetailPage } from '../../src/pages/SecurityDetailPage';
import { accountList, accounts, currentMonthBalance, dividendMetrics, purchases } from '../fixtures';
import { apiError, mockApi, renderPage, requestCalls } from '../testUtils';

vi.mock('../../src/api/client', async (importOriginal) => ({ ...(await importOriginal<object>()), request: vi.fn() }));

const security = { id: 'KR7005930003', symbol: '005930', name: '삼성전자', currency: 'KRW' };

const setup = ({ accountsList = accounts, route = '/securities/KR7005930003' } = {}) => {
  mockApi({
    'GET /balance/purchases': purchases(),
    'GET /accounts': accountList(accountsList),
    'GET /daily-securities': { security, from: null, to: null, prices: [] },
    'GET /dividends': { security, months: [] },
    'GET /balance/dividend-metrics': dividendMetrics(),
    'PATCH /balance/purchases/account': undefined,
  });
  renderPage(<SecurityDetailPage />, { route, path: '/securities/:securityId' });
};

describe('SecurityDetailPage', () => {
  it('보유 수량은 계좌별 칩으로, 매수 내역은 행마다 계좌 칩으로 보여준다', async () => {
    setup();
    expect(await screen.findByText('토스 3')).toBeInTheDocument();
    expect(screen.getByText('키움 ISA 2')).toBeInTheDocument();
    expect(screen.getByText('토스')).toBeInTheDocument();
    expect(screen.getByText('키움 ISA')).toBeInTheDocument();
    expect(screen.queryByText('KR7005930003')).toBeNull();
  });

  it('계좌 이동은 현재 계좌를 빼고 고르게 하고, 고른 계좌로 이동 요청을 보낸다', async () => {
    setup();
    await screen.findByText('토스 3');
    // 첫 행 = 토스 계좌 매수분 (2026-02-03 #1)
    fireEvent.click(screen.getAllByRole('button', { name: '계좌 이동' })[0]);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '옮길 계좌' }));
    const option = await screen.findByRole('option', { name: '키움증권 · ISA' });
    // 현재 계좌(토스)는 옮길 곳에서 빠진다
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['키움증권 · ISA']);
    fireEvent.click(option);
    fireEvent.click(screen.getByRole('button', { name: '이동' }));

    await waitFor(() => expect(requestCalls('PATCH', '/balance/purchases/account')).toHaveLength(1));
    expect(requestCalls('PATCH', '/balance/purchases/account')[0].body).toEqual({
      securityId: 'KR7005930003',
      purchaseDate: '2026-02-03',
      sequence: 1,
      accountId: 2,
    });
  });

  it('옮길 다른 계좌가 없으면 계좌 관리 안내를 보여준다', async () => {
    setup({ accountsList: [accounts[0]] });
    await screen.findByText('토스 3');
    fireEvent.click(screen.getAllByRole('button', { name: '계좌 이동' })[0]);
    expect(await screen.findByText(/옮길 다른 계좌가 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이동' })).toBeDisabled();
  });

  it('URL의 계좌 필터를 매수 내역 요청에 넣는다', async () => {
    setup({ route: '/securities/KR7005930003?accountId=1' });
    await screen.findByText('토스 3');
    expect(requestCalls('GET', '/balance/purchases').at(-1)?.query).toEqual({
      securityId: 'KR7005930003',
      accountId: 1,
    });
  });

  it('회당 평균으로 계산한 배당 성장률은 그 기준을 함께 보여준다', async () => {
    const metrics = heldMetrics();
    mockApi({
      'GET /balance/purchases': purchases(),
      'GET /accounts': accountList(),
      'GET /daily-securities': { security, from: null, to: null, prices: [] },
      'GET /dividends': { security, months: [] },
      'GET /balance/dividend-metrics': metrics,
      // 원금 350,000 > 평가 335,000 + 누적배당 5,000 → 손실 10,000 / 연배당 1,190 → 101개월
      'GET /balance/monthly': monthlyFor('340000'),
    });
    renderPage(<SecurityDetailPage />, { route: '/securities/KR7005930003', path: '/securities/:securityId' });

    expect(await screen.findByText('+6.79%')).toBeInTheDocument();
    expect(screen.getByText('상장 1년 미만 · 회당 평균 18.57원 → 19.83원')).toBeInTheDocument();
    expect(await screen.findByText(/지금 배당이면 약 8년 5개월 뒤/)).toBeInTheDocument();
    expect(screen.getByText('-10,000원')).toBeInTheDocument();
  });

  const renderWithMonthly = (monthly: unknown) => {
    mockApi({
      'GET /balance/purchases': purchases(),
      'GET /accounts': accountList(),
      'GET /daily-securities': { security, from: null, to: null, prices: [] },
      'GET /dividends': { security, months: [] },
      'GET /balance/dividend-metrics': heldMetrics(),
      'GET /balance/monthly': monthly,
    });
    renderPage(<SecurityDetailPage />, { route: '/securities/KR7005930003', path: '/securities/:securityId' });
  };

  it('배당 포함 손실이 없으면 원금 회복 자리에 안내 문구를 보여준다', async () => {
    renderWithMonthly(monthlyFor('380000'));
    expect(await screen.findByText(/배당 포함 손실이 없어요/)).toBeInTheDocument();
    expect(screen.getByText('+30,000원')).toBeInTheDocument();
    expect(screen.queryByText(/지금 배당이면/)).toBeNull();
  });

  it('월별 잔고 조회가 실패하면 원금 회복 자리에 오류 안내를 보여준다', async () => {
    renderWithMonthly(apiError(500, '월별 잔고 조회 실패'));
    expect(await screen.findByText('정보를 불러오지 못했어요. 월별 잔고 조회 실패')).toBeInTheDocument();
  });
});

/** 삼성전자 5주 보유, 연배당 1,190원 (PER_PAYMENT 성장률) */
function heldMetrics() {
  const metrics = dividendMetrics();
  metrics.items = [
    {
      securityId: 'KR7005930003',
      symbol: '005930',
      name: '삼성전자',
      currency: 'KRW',
      quantity: '5',
      trailingPerShare: '238',
      paymentCount: 12,
      previousPerShare: '130',
      previousPaymentCount: 7,
      growthRate: '6.79',
      growthBasis: 'PER_PAYMENT',
      annualDividend: '1190',
      krwAnnualDividend: '1190',
      krwPurchaseAmount: '350000',
      closingPrice: '71000',
      priceDate: '2026-11-21',
      krwEvaluationAmount: '355000',
      yieldOnCost: '0.34',
      currentYield: '0.33',
    },
  ];
  return metrics;
}

/** 이번 달 삼성전자 원금 350,000원, 평가금액 + 누적배당금 = totalAmount (누적배당 5,000원) */
function monthlyFor(totalAmount: string) {
  return currentMonthBalance([
    {
      securityId: 'KR7005930003',
      name: '삼성전자',
      quantity: '5',
      purchaseAmount: '350000',
      evaluationAmount: String(Number(totalAmount) - 5000),
      dividendAmount: '5000',
      totalAmount,
    },
  ]);
}
