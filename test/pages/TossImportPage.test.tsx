import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { BulkRegisterTossResponse } from '../../src/api/types';
import { TossImportPage } from '../../src/pages/TossImportPage';
import { accountList, accounts } from '../fixtures';
import { mockApi, renderPage, requestCalls } from '../testUtils';

jest.mock('../../src/api/client', () => ({ ...jest.requireActual('../../src/api/client'), request: jest.fn() }));

const buy = {
  transactionType: 'BUY',
  marketCountry: 'KR',
  currency: 'KRW',
  symbol: '005930',
  assetClass: 'STOCK',
  isinCode: 'KR7005930003',
  quantity: 10,
  filledPrice: '70000',
  exchangeRate: null,
  settlementDate: '2026-03-05',
  settled: true,
  transactionTime: '2026-03-03T10:00:00+09:00',
  isCancellation: false,
  // 백엔드가 읽지 않는 필드는 요청에서 빠져야 한다
  amount: '700000',
  commission: '100',
};
const transferOut = {
  ...buy,
  transactionType: 'SECURITIES_TRANSFER_OUT',
  quantity: '4',
  filledPrice: null,
  settlementDate: '2026-04-07',
};

const lentKey = { isinCode: 'KR7005930003', settlementDate: '2026-04-07', quantity: '4', index: 0 };
const result = (overrides: Partial<BulkRegisterTossResponse> = {}): BulkRegisterTossResponse => ({
  accountId: 7,
  deletedCount: 0,
  boughtCount: 1,
  soldCount: 0,
  skipped: [],
  lentTransfers: [{ key: lentKey, remainingQuantity: '4' }],
  ...overrides,
});

const setup = () => {
  let posts = 0;
  mockApi({
    'GET /accounts': accountList([accounts[0]]),
    'POST /balance/toss': () => (++posts === 1 ? result() : result({ soldCount: 1, lentTransfers: [] })),
  });
  renderPage(<TossImportPage />, { route: '/toss-import' });
};

const pasteAndPreview = (json: unknown) => {
  fireEvent.change(screen.getByRole('textbox', { name: '거래내역 JSON' }), {
    target: { value: typeof json === 'string' ? json : JSON.stringify(json) },
  });
  fireEvent.click(screen.getByRole('button', { name: '미리보기' }));
};

describe('TossImportPage', () => {
  it('JSON이 잘못되면 미리보기 대신 오류를 보여준다', async () => {
    setup();
    pasteAndPreview('{ not json');
    expect(await screen.findByText('JSON 형식이 올바르지 않습니다.')).toBeInTheDocument();
  });

  it('확인 체크 전에는 등록할 수 없고, 등록하면 고른 계좌와 13개 필드만 보낸다', async () => {
    setup();
    // 목록을 연 채로 토스 계좌 목록이 들어올 때까지 기다렸다가 고른다
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '계좌' }));
    fireEvent.click(await screen.findByRole('option', { name: '토스증권 · 일반' }));
    pasteAndPreview({ transactionList: [buy, transferOut] });

    const submit = await screen.findByRole('button', { name: '일괄등록' });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /위 거래내역을 확인했고/ }));
    fireEvent.click(submit);

    await waitFor(() => expect(requestCalls('POST', '/balance/toss')).toHaveLength(1));
    const body = requestCalls('POST', '/balance/toss')[0].body as {
      accountId?: number;
      transactionList: Record<string, unknown>[];
    };
    expect(body.accountId).toBe(1);
    expect(body.transactionList).toHaveLength(2);
    expect(Object.keys(body.transactionList[0]).sort()).toEqual(
      [
        'transactionType',
        'marketCountry',
        'currency',
        'symbol',
        'assetClass',
        'isinCode',
        'quantity',
        'filledPrice',
        'exchangeRate',
        'settlementDate',
        'settled',
        'transactionTime',
        'isCancellation',
      ].sort(),
    );
    expect(body.transactionList[0].quantity).toBe('10'); // 숫자도 decimal 문자열로
  });

  it('대여 중으로 본 출고를 고르면 응답의 계좌와 받은 key 그대로 다시 등록한다', async () => {
    setup();
    pasteAndPreview({ transactionList: [buy, transferOut] });
    fireEvent.click(await screen.findByRole('checkbox', { name: /위 거래내역을 확인했고/ }));
    fireEvent.click(screen.getByRole('button', { name: '일괄등록' }));

    expect(await screen.findByText('대여 중으로 본 출고', { selector: 'h6' })).toBeInTheDocument();
    const resubmit = screen.getByRole('button', { name: /선택한 출고 0건을/ });
    expect(resubmit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: '실제 출고' }));
    fireEvent.click(screen.getByRole('button', { name: '선택한 출고 1건을 매도로 다시 등록' }));

    await waitFor(() => expect(requestCalls('POST', '/balance/toss')).toHaveLength(2));
    const second = requestCalls('POST', '/balance/toss')[1].body as Record<string, unknown>;
    expect(second.accountId).toBe(7);
    expect(second.confirmedTransfersOut).toEqual([lentKey]);
    // 다시 등록한 결과에는 대여 중 출고가 없다
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: '실제 출고' })).toBeNull());
  });
});
