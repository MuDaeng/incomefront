import { fireEvent, screen } from '@testing-library/react';
import { DividendsPage } from '../../src/pages/DividendsPage';
import { accountList, dividendHistory, dividendMetrics, scheduledDividends } from '../fixtures';
import { mockApi, renderPage, requestCalls } from '../testUtils';

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
    renderPage(<DividendsPage />, { route: '/dividends?accountId=2' });
    expect(await screen.findByText('총 배당금 (세전)')).toBeInTheDocument();
    expect(requestCalls('GET', '/balance/dividends').at(-1)?.query?.accountId).toBe(2);
    expect(requestCalls('GET', '/balance/dividend-metrics').at(-1)?.query?.accountId).toBe(2);
  });
});
