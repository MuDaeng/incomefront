import { fireEvent, screen } from '@testing-library/react';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { accountList, dividendMetrics, integratedBalance } from '../fixtures';
import { mockApi, renderPage, requestCalls } from '../testUtils';

jest.mock('../../src/api/client', () => ({ ...jest.requireActual('../../src/api/client'), request: jest.fn() }));

const setup = (balance = integratedBalance(), route = '/') => {
  const openRegister = jest.fn();
  mockApi({
    'GET /balance': balance,
    'GET /accounts': accountList(),
    'GET /balance/dividend-metrics': dividendMetrics(),
  });
  renderPage(<DashboardPage />, { route, outletContext: { openRegister } });
  return { openRegister };
};

describe('DashboardPage', () => {
  it('보유 종목은 이름·심볼과 계좌별 수량 칩으로 보여주고 ISIN은 숨긴다', async () => {
    setup();
    expect((await screen.findAllByText('삼성전자')).length).toBeGreaterThan(0);
    expect(screen.getByText('005930')).toBeInTheDocument();
    expect(screen.getByText('토스 3')).toBeInTheDocument();
    expect(screen.getByText('키움 ISA 2')).toBeInTheDocument();
    expect(screen.queryByText('KR7005930003')).toBeNull();
  });

  it('URL의 계좌 필터를 잔고·배당 지표 요청에 넣는다', async () => {
    setup(integratedBalance(), '/?accountId=2');
    expect((await screen.findAllByText('삼성전자')).length).toBeGreaterThan(0);
    expect(requestCalls('GET', '/balance').at(-1)?.query?.accountId).toBe(2);
    expect(requestCalls('GET', '/balance/dividend-metrics').at(-1)?.query?.accountId).toBe(2);
  });

  it('필터한 계좌에 보유 종목이 없으면 그 계좌 이름으로 안내한다', async () => {
    setup(integratedBalance({ items: [] }), '/?accountId=2');
    expect(await screen.findByText('키움증권 · ISA로 보유한 종목이 없어요')).toBeInTheDocument();
  });

  it('보유 종목이 없을 때 매수 등록 버튼은 필터 계좌로 등록 창을 연다', async () => {
    const { openRegister } = setup(integratedBalance({ items: [] }));
    expect(await screen.findByText('아직 보유 종목이 없어요')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: '매수 등록' })[0]);
    expect(openRegister).toHaveBeenCalledWith(undefined, undefined);
  });
});
