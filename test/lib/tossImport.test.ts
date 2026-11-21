import type { TossTransaction } from '../../src/api/types';
import {
  mergeTransferKeys,
  parseTossTransactions,
  summarizeTossTransactions,
  tossRequestBodySize,
  tossSkipReason,
  tossTradeDate,
  tossTransactionKind,
  tossTransferKeyId,
} from '../../src/lib/tossImport';

const raw = {
  transactionType: 'BUY',
  marketCountry: 'US',
  currency: 'USD',
  symbol: 'NVDL',
  assetClass: 'STOCK',
  isinCode: 'US38747R8271',
  quantity: '1',
  filledPrice: '55.93',
  amount: '55.93',
  commission: '0.05',
  tax: '0',
  netAmount: '55.98',
  exchangeRate: '1437.1',
  settlementDate: '2025-01-29',
  settled: true,
  transactionTime: '2025-01-28T23:27:39.364Z',
  isCancellation: false,
  cancellation: false,
};

const tx = (overrides: Partial<TossTransaction> = {}): TossTransaction => ({
  transactionType: 'BUY',
  marketCountry: 'US',
  currency: 'USD',
  symbol: 'NVDL',
  assetClass: 'STOCK',
  isinCode: 'US38747R8271',
  quantity: '1',
  filledPrice: '55.93',
  exchangeRate: '1437.1',
  settlementDate: '2025-01-29',
  settled: true,
  transactionTime: '2025-01-28T23:27:39.364Z',
  isCancellation: false,
  ...overrides,
});

describe('parseTossTransactions', () => {
  it.each([
    ['{ transactionList }', { transactionList: [raw] }],
    ['배열', [raw]],
    ['{ transactions }', { transactions: [raw] }],
    ['{ result: { transactions } }', { result: { transactions: [raw] } }],
  ])('%s 형태를 받는다', (_, data) => {
    const result = parseTossTransactions(JSON.stringify(data));
    expect(result).toEqual({ ok: true, transactions: [tx()] });
  });

  it('쓰지 않는 금액 필드는 버린다', () => {
    const result = parseTossTransactions(JSON.stringify([raw]));
    if (!result.ok) throw new Error(result.error);
    expect(Object.keys(result.transactions[0])).not.toContain('amount');
    expect(Object.keys(result.transactions[0])).not.toContain('cancellation');
  });

  it('null 필드를 유지한다', () => {
    const result = parseTossTransactions(
      JSON.stringify([{ ...raw, transactionType: 'SECURITIES_TRANSFER_IN', filledPrice: null, exchangeRate: null }]),
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.transactions[0].filledPrice).toBeNull();
    expect(result.transactions[0].exchangeRate).toBeNull();
  });

  it.each([
    ['', 'JSON을 입력'],
    ['{', 'JSON 형식'],
    ['{"foo":1}', '찾을 수 없습니다'],
    ['{"transactionList":[]}', '비어 있습니다'],
    ['[1]', '1번째 거래가 객체가 아닙니다'],
    [JSON.stringify([raw, { ...raw, transactionType: '' }]), '2번째 거래에 transactionType'],
    [JSON.stringify([{ ...raw, settlementDate: '20250129' }]), 'settlementDate'],
  ])('잘못된 입력 %#은 에러', (text, message) => {
    const result = parseTossTransactions(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});

describe('tossTradeDate', () => {
  it('결제일에서 평일 2일 앞당긴다 (수 → 월)', () => {
    expect(tossTradeDate(tx())).toBe('2025-01-27');
  });

  it('주말을 건너뛴다 (월 → 지난주 목)', () => {
    expect(tossTradeDate(tx({ settlementDate: '2025-02-24' }))).toBe('2025-02-20');
  });

  it('결제일이 주말이면 그 전 평일부터 센다 (토 → 수)', () => {
    expect(tossTradeDate(tx({ settlementDate: '2025-02-22' }))).toBe('2025-02-19');
  });

  it('시장·체결 시각·미결제 여부와 무관하다', () => {
    expect(
      tossTradeDate(tx({ marketCountry: 'KR', transactionTime: '2025-02-09T15:19:15.783Z', settlementDate: '2025-02-12' })),
    ).toBe('2025-02-10');
    expect(tossTradeDate(tx({ transactionTime: null, settlementDate: '2026-11-25' }))).toBe('2026-11-23');
  });
});

describe('tossTransactionKind / tossSkipReason', () => {
  it('유형을 분류한다', () => {
    expect(tossTransactionKind(tx())).toBe('buy');
    expect(tossTransactionKind(tx({ transactionType: 'SELL' }))).toBe('sell');
    expect(tossTransactionKind(tx({ transactionType: 'SECURITIES_TRANSFER_IN' }))).toBe('transferIn');
    expect(tossTransactionKind(tx({ transactionType: 'SECURITIES_TRANSFER_OUT' }))).toBe('transferOut');
    expect(tossTransactionKind(tx({ transactionType: 'DIVIDEND' }))).toBe('other');
  });

  it('제외 예상 사유', () => {
    expect(tossSkipReason(tx())).toBeNull();
    expect(tossSkipReason(tx({ transactionType: 'DEPOSIT' }))).toBe('등록 대상 아님');
    expect(tossSkipReason(tx({ isCancellation: true }))).toBe('취소 거래');
    expect(tossSkipReason(tx({ isinCode: null }))).toBe('ISIN 없음');
    expect(tossSkipReason(tx({ quantity: null }))).toBe('수량 또는 단가 없음');
    expect(tossSkipReason(tx({ filledPrice: null }))).toBe('수량 또는 단가 없음');
    // 입고·출고·매도는 단가가 없어도 된다
    expect(tossSkipReason(tx({ transactionType: 'SECURITIES_TRANSFER_IN', filledPrice: null }))).toBeNull();
    expect(tossSkipReason(tx({ transactionType: 'SECURITIES_TRANSFER_OUT', filledPrice: null }))).toBeNull();
  });
});

describe('summarizeTossTransactions', () => {
  it('유형별·제외 예상 건수를 센다', () => {
    const summary = summarizeTossTransactions([
      tx(),
      tx({ filledPrice: null }),
      tx({ transactionType: 'SELL' }),
      tx({ transactionType: 'SECURITIES_TRANSFER_IN', filledPrice: null }),
      tx({ transactionType: 'SECURITIES_TRANSFER_OUT' }),
      tx({ transactionType: 'DIVIDEND' }),
    ]);
    expect(summary).toEqual({
      total: 6,
      buy: 2,
      sell: 1,
      transferIn: 1,
      transferOut: 1,
      other: 1,
      skipped: 1,
    });
  });
});

describe('tossRequestBodySize', () => {
  it('요청 body 바이트 수', () => {
    const list = [tx()];
    expect(tossRequestBodySize(list)).toBe(JSON.stringify({ transactionList: list }).length);
  });
});

describe('출고 키', () => {
  const a = { isinCode: 'US0000000001', settlementDate: '2026-11-03', quantity: '10.000000', index: 0 };
  const b = { ...a, index: 1 };

  it('키 문자열은 네 필드를 모두 담는다', () => {
    expect(tossTransferKeyId(a)).toBe('US0000000001|2026-11-03|10.000000|0');
    expect(tossTransferKeyId(a)).not.toBe(tossTransferKeyId(b));
  });

  it('확인한 출고에 새 출고를 더하고 같은 키는 한 번만', () => {
    expect(mergeTransferKeys([a], [a, b])).toEqual([a, b]);
    expect(mergeTransferKeys([], [])).toEqual([]);
  });
});
