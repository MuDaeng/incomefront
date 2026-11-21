import { fireEvent, screen, within } from '@testing-library/react';
import { ReturnsPage } from '../../src/pages/ReturnsPage';
import { accountList, monthlyBalance, periodReturn } from '../fixtures';
import { mockApi, renderPage, requestCalls } from '../testUtils';

jest.mock('../../src/api/client', () => ({ ...jest.requireActual('../../src/api/client'), request: jest.fn() }));

const setup = (data = periodReturn(), route = '/returns') => {
  mockApi({
    'GET /balance/returns': data,
    'GET /accounts': accountList(),
    'GET /balance/monthly': monthlyBalance(),
  });
  return renderPage(<ReturnsPage />, { route });
};

beforeEach(() => localStorage.clear());

describe('ReturnsPage', () => {
  it('세후로 바꾸면 총수익·수익률·배당금이 세후 값이 된다', async () => {
    setup();
    expect(await screen.findByText(/^총수익 세전/)).toBeInTheDocument();
    expect(screen.getAllByText('+21,000원').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+21.00%').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '세후' }));

    expect(screen.getByText(/^총수익 세후/)).toBeInTheDocument();
    expect(screen.getAllByText('+19,500원').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+19.50%').length).toBeGreaterThan(0);
    expect(screen.queryByText('+21.00%')).toBeNull();
    expect(screen.getByText('배당금 (세후)')).toBeInTheDocument();
    expect(screen.queryByText('+21,000원')).toBeNull();
  });

  it('배당금 탭의 합계도 선택한 기준을 따른다', async () => {
    setup();
    fireEvent.click(await screen.findByRole('tab', { name: '배당금' }));
    const totalRow = () => screen.getByText('합계').closest('tr') as HTMLElement;
    expect(within(totalRow()).getByText('11,000원')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '세후' }));
    expect(within(totalRow()).getByText('9,500원')).toBeInTheDocument();
  });

  it('기간에 보유했던 종목이 없으면 빈 화면 안내를 보여준다', async () => {
    const empty = periodReturn();
    setup({ ...empty, total: { ...empty.total, items: [] } });
    expect(await screen.findByText('이 기간에 보유했던 종목이 없어요')).toBeInTheDocument();
  });

  it('URL의 계좌 필터를 수익률·월별 추이 요청에 넣는다', async () => {
    setup(periodReturn(), '/returns?accountId=1');
    expect(await screen.findByText(/^총수익 세전/)).toBeInTheDocument();
    expect(requestCalls('GET', '/balance/returns').at(-1)?.query?.accountId).toBe(1);
    expect(requestCalls('GET', '/balance/monthly').at(-1)?.query?.accountId).toBe(1);
  });
});
