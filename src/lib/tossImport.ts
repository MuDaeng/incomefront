import type { TossTransaction } from '../api/types';

/** 백엔드 Express JSON body 한도 (main.ts의 1mb) */
export const TOSS_BODY_LIMIT_BYTES = 1024 * 1024;

export type TossKind = 'buy' | 'sell' | 'transferIn' | 'transferOut' | 'other';

export const TOSS_KIND_LABEL: Record<TossKind, string> = {
  buy: '매수',
  sell: '매도',
  transferIn: '입고',
  transferOut: '출고',
  other: '기타',
};

export type ParseResult =
  | { ok: true; transactions: TossTransaction[] }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** 배열 / { transactionList } / { transactions } / { result: { transactions } } 에서 거래 배열을 꺼낸다 */
const extractList = (data: unknown): unknown[] | null => {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return null;
  if (Array.isArray(data.transactionList)) return data.transactionList;
  if (Array.isArray(data.transactions)) return data.transactions;
  if (isRecord(data.result)) return extractList(data.result);
  return null;
};

const stringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  return typeof value === 'number' ? String(value) : typeof value === 'string' ? value : null;
};

/**
 * 붙여넣거나 파일로 읽은 Toss 거래내역 JSON을 요청용 거래 목록으로 바꾼다.
 * 백엔드가 쓰는 13개 필드만 남겨 body를 줄인다 (amount·commission·tax 등은 버림)
 */
export const parseTossTransactions = (text: string): ParseResult => {
  if (!text.trim()) return { ok: false, error: 'JSON을 입력하거나 파일을 선택하세요.' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'JSON 형식이 올바르지 않습니다.' };
  }
  const list = extractList(data);
  if (!list) {
    return { ok: false, error: '거래 목록(transactionList 배열)을 찾을 수 없습니다.' };
  }
  if (list.length === 0) return { ok: false, error: '거래 목록이 비어 있습니다.' };

  const transactions: TossTransaction[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const at = `${i + 1}번째 거래`;
    if (!isRecord(item)) return { ok: false, error: `${at}가 객체가 아닙니다.` };
    if (typeof item.transactionType !== 'string' || !item.transactionType) {
      return { ok: false, error: `${at}에 transactionType이 없습니다.` };
    }
    if (typeof item.settlementDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.settlementDate)) {
      return { ok: false, error: `${at}의 settlementDate가 'YYYY-MM-DD' 형식이 아닙니다.` };
    }
    transactions.push({
      transactionType: item.transactionType,
      marketCountry: typeof item.marketCountry === 'string' ? item.marketCountry : '',
      currency: typeof item.currency === 'string' ? item.currency : '',
      symbol: stringOrNull(item.symbol),
      assetClass: stringOrNull(item.assetClass),
      isinCode: stringOrNull(item.isinCode),
      quantity: stringOrNull(item.quantity),
      filledPrice: stringOrNull(item.filledPrice),
      exchangeRate: stringOrNull(item.exchangeRate),
      settlementDate: item.settlementDate,
      settled: item.settled === true,
      transactionTime: stringOrNull(item.transactionTime),
      isCancellation: item.isCancellation === true,
    });
  }
  return { ok: true, transactions };
};

/** Toss settlementDate(결제일)는 체결일보다 이만큼 거래일 늦다 */
const TOSS_SETTLEMENT_LAG_DAYS = 2;

/** 'YYYY-MM-DD'에 days일을 더한 날짜 (UTC 날짜 계산이라 시간대 영향 없음) */
const addIsoDays = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const isWeekend = (isoDate: string): boolean => {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

/** date(포함) 이전 가장 가까운 평일 */
const weekdayOnOrBefore = (isoDate: string): string => {
  let date = isoDate;
  while (isWeekend(date)) date = addIsoDays(date, -1);
  return date;
};

/**
 * Toss 거래 한 건의 체결일(매수일·매도일) 'YYYY-MM-DD' 미리보기: settlementDate에서 평일 2일 앞.
 * 백엔드 toss-trade-date.ts(security/trading-day.ts의 krwTradingDayBefore)는 저장된 KRX 거래일로 공휴일까지
 * 빼므로, 그 사이에 공휴일이 끼면 서버 날짜가 더 이르다. 거래일 목록이 없을 때의 서버 평일 계산과는 같다.
 * 결제일이 잘못된 형식이면 그대로 돌려준다.
 */
export const tossTradeDate = (tx: Pick<TossTransaction, 'settlementDate'>): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.settlementDate)) return tx.settlementDate;
  let date = weekdayOnOrBefore(tx.settlementDate);
  for (let i = 0; i < TOSS_SETTLEMENT_LAG_DAYS; i++) {
    date = weekdayOnOrBefore(addIsoDays(date, -1));
  }
  return date;
};

export const tossTransactionKind = (tx: Pick<TossTransaction, 'transactionType'>): TossKind => {
  switch (tx.transactionType) {
    case 'BUY':
      return 'buy';
    case 'SELL':
      return 'sell';
    case 'SECURITIES_TRANSFER_IN':
      return 'transferIn';
    case 'SECURITIES_TRANSFER_OUT':
      return 'transferOut';
    default:
      return 'other';
  }
};

/**
 * 백엔드가 건너뛸 것으로 예상되는 사유 (없으면 null).
 * 종목 마스터에 없는 ISIN과 입고일 시세 없음은 서버만 알 수 있어 판단하지 않는다
 */
export const tossSkipReason = (tx: TossTransaction): string | null => {
  const kind = tossTransactionKind(tx);
  if (kind === 'other') return '등록 대상 아님';
  if (tx.isCancellation) return '취소 거래';
  if (!tx.isinCode) return 'ISIN 없음';
  if (tx.quantity === null || (kind === 'buy' && tx.filledPrice === null)) {
    return '수량 또는 단가 없음';
  }
  return null;
};

export interface TossSummary {
  total: number;
  buy: number;
  sell: number;
  transferIn: number;
  transferOut: number;
  other: number;
  /** 등록 대상 유형이지만 건너뛸 것으로 예상되는 거래 수 (기타 유형 제외) */
  skipped: number;
}

export const summarizeTossTransactions = (list: TossTransaction[]): TossSummary => {
  const summary: TossSummary = {
    total: list.length,
    buy: 0,
    sell: 0,
    transferIn: 0,
    transferOut: 0,
    other: 0,
    skipped: 0,
  };
  for (const tx of list) {
    const kind = tossTransactionKind(tx);
    summary[kind] += 1;
    if (kind !== 'other' && tossSkipReason(tx) !== null) summary.skipped += 1;
  }
  return summary;
};

/** 요청 body의 UTF-8 바이트 수 */
export const tossRequestBodySize = (transactions: TossTransaction[]): number =>
  new Blob([JSON.stringify({ transactionList: transactions })]).size;
