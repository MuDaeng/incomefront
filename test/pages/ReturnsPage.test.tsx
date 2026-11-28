import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import dayjs from 'dayjs';
import { ReturnsPage } from '../../src/pages/ReturnsPage';
import { accountList, currentMonthBalance, monthlyBalance, periodReturn } from '../fixtures';
import { mockApi, renderPage, requestCalls } from '../testUtils';

vi.mock('../../src/api/client', async (importOriginal) => ({ ...(await importOriginal<object>()), request: vi.fn() }));

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
    expect(screen.getAllByText('+16,000원').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+15.23%').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '세후' }));

    expect(screen.getByText(/^총수익 세후/)).toBeInTheDocument();
    expect(screen.getAllByText('+14,500원').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+13.80%').length).toBeGreaterThan(0);
    expect(screen.queryByText('+15.23%')).toBeNull();
    expect(screen.getByText('배당금 (세후)')).toBeInTheDocument();
    expect(screen.queryByText('+16,000원')).toBeNull();
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

  it('평가손익은 원금이 아니라 기준금액 대비 서버 값을 보여준다', async () => {
    setup();
    expect(await screen.findByText(/^총수익 세전/)).toBeInTheDocument();
    expect(screen.getAllByText('+5,000원').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+4.76%').length).toBeGreaterThan(0);
    // 평가금액 − 원금(+10,000원)은 어디에도 나오지 않는다
    expect(screen.queryByText('+10,000원')).toBeNull();
    expect(screen.getByText('기준금액 대비 10.48%')).toBeInTheDocument();
  });

  it('평가금액 탭에 기준금액과 시작 종가를 보여준다', async () => {
    setup();
    fireEvent.click(await screen.findByRole('tab', { name: '평가금액' }));
    expect(screen.getByRole('columnheader', { name: '기준금액' })).toBeInTheDocument();
    const totalRow = screen.getByText('합계').closest('tr') as HTMLElement;
    expect(within(totalRow).getByText('105,000원')).toBeInTheDocument();
    expect(screen.getByText(/^시작 10,500원/)).toBeInTheDocument();
  });

  it('시작 환율이 있으면 캡션에 함께 보여준다', async () => {
    setup(periodReturn({ startExchangeRate: '1450.50', startExchangeRateDate: '2025-12-31' }));
    expect(await screen.findByText(/시작일 전 매수분 기준금액 환율/)).toBeInTheDocument();
  });

  it('하루 프리셋은 어제부터 오늘까지 조회한다', async () => {
    setup();
    expect(await screen.findByText(/^총수익 세전/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '오늘' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '하루' }));
    await waitFor(() =>
      expect(requestCalls('GET', '/balance/returns').at(-1)?.query).toMatchObject({
        from: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        to: dayjs().format('YYYY-MM-DD'),
      }),
    );
  });

  it('전체 프리셋은 시작일 없이 오늘까지 조회하고, 월별 추이는 최근 120개월을 조회한다', async () => {
    setup(periodReturn({ from: null }));
    expect(await screen.findByText(/^총수익 세전 \(처음부터 ~ /)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '최근 3년' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '전체' }));
    await waitFor(() => {
      const query = requestCalls('GET', '/balance/returns').at(-1)?.query;
      expect(query).toMatchObject({ to: dayjs().format('YYYY-MM-DD') });
      expect(query?.from).toBeUndefined();
    });
    await waitFor(() =>
      expect(requestCalls('GET', '/balance/monthly').at(-1)?.query).toMatchObject({
        from: dayjs().subtract(119, 'month').format('YYYY-MM'),
        to: dayjs().format('YYYY-MM'),
      }),
    );
  });

  it('월별 추이는 첫 매수 전의 빈 달을 잘라서 보여 준다', async () => {
    const month = dayjs().format('YYYY-MM');
    const current = currentMonthBalance([{ securityId: 'KR1', name: '삼성전자', purchaseAmount: '1000' }], month);
    mockApi({
      'GET /balance/returns': periodReturn(),
      'GET /accounts': accountList(),
      'GET /balance/monthly': {
        ...current,
        from: '2020-01',
        months: [{ ...current.months[0], month: '2020-01', date: '2020-01-31', items: [] }, ...current.months],
      },
    });
    renderPage(<ReturnsPage />, { route: '/returns' });
    const thisMonth = dayjs().format('YYYY.MM');
    expect(await screen.findByText((t) => t.startsWith(`${thisMonth} ~ `))).toBeInTheDocument();
    expect(screen.queryByText((t) => t.startsWith('2020.01'))).toBeNull();
  });

  it('URL의 계좌 필터를 수익률·월별 추이 요청에 넣는다', async () => {
    setup(periodReturn(), '/returns?accountId=1');
    expect(await screen.findByText(/^총수익 세전/)).toBeInTheDocument();
    expect(requestCalls('GET', '/balance/returns').at(-1)?.query?.accountId).toBe(1);
    expect(requestCalls('GET', '/balance/monthly').at(-1)?.query?.accountId).toBe(1);
  });
});
