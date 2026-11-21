import { fireEvent, screen, waitFor } from '@testing-library/react';
import { SecurityDetailPage } from '../../src/pages/SecurityDetailPage';
import { accountList, accounts, dividendMetrics, purchases } from '../fixtures';
import { mockApi, renderPage, requestCalls } from '../testUtils';

jest.mock('../../src/api/client', () => ({ ...jest.requireActual('../../src/api/client'), request: jest.fn() }));

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
});
