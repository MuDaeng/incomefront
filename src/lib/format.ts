import type { Currency } from '../api/types';

type Value = string | number | null | undefined;

export const toNumber = (value: Value): number =>
  value === null || value === undefined || value === '' ? NaN : Number(value);

const EMPTY = '-';

/**
 * 소수 digits자리 아래를 버린다 (0 방향).
 * 부동소수점 곱셈 오차(0.29 * 100 = 28.999…)로 한 단위 덜 잘리지 않도록
 * 먼저 digits+6자리에서 반올림한 문자열을 잘라낸다.
 */
export const truncateDecimals = (value: number, digits: number): number => {
  if (!Number.isFinite(value)) return value;
  const [int, frac = ''] = Math.abs(value).toFixed(digits + 6).split('.');
  const cut = Number(digits > 0 ? `${int}.${frac.slice(0, digits)}` : int);
  return value < 0 && cut !== 0 ? -cut : cut;
};

/** 원화: 정수(원 미만 버림), 천 단위 구분 */
export const formatKrw = (value: Value): string => {
  const n = toNumber(value);
  return Number.isNaN(n) ? EMPTY : `${truncateDecimals(n, 0).toLocaleString('ko-KR')}원`;
};

/** 달러: 기본 소수 2자리, maxDigits 아래는 버림 (반올림하지 않음) */
export const formatUsd = (value: Value, maxDigits = 2): string => {
  const n = truncateDecimals(toNumber(value), maxDigits);
  if (Number.isNaN(n)) return EMPTY;
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDigits,
  })}`;
};

/** 종목 통화 기준 가격 (USD 단가는 소수 4자리까지) */
export const formatPrice = (value: Value, currency: Currency): string =>
  currency === 'KRW' ? formatKrw(value) : formatUsd(value, 4);

/** 입력란에 채울 단가 문자열: 원화는 정수, 달러는 소수 2자리, 그 아래는 버림 (천 단위 구분 없음) */
export const toPriceInput = (value: Value, currency: Currency): string => {
  const n = toNumber(value);
  if (Number.isNaN(n)) return '';
  return currency === 'KRW' ? String(truncateDecimals(n, 0)) : truncateDecimals(n, 2).toFixed(2);
};

/** 종목 통화 기준 금액 */
export const formatMoney = (value: Value, currency: Currency): string =>
  currency === 'KRW' ? formatKrw(value) : formatUsd(value);

/** 수량: 소수 6자리까지 */
export const formatQuantity = (value: Value): string => {
  const n = toNumber(value);
  return Number.isNaN(n)
    ? EMPTY
    : n.toLocaleString('ko-KR', { maximumFractionDigits: 6 });
};

const signOf = (n: number) => (n > 0 ? '+' : '');

/** 수익률(%): +1.23% */
export const formatRate = (value: Value): string => {
  const n = toNumber(value);
  return Number.isNaN(n) ? EMPTY : `${signOf(n)}${n.toFixed(2)}%`;
};

/** 부호 붙은 원화: +12,345원 */
export const formatSignedKrw = (value: Value): string => {
  const n = toNumber(value);
  return Number.isNaN(n) ? EMPTY : `${signOf(n)}${formatKrw(n)}`;
};

export const formatSignedUsd = (value: Value): string => {
  const n = toNumber(value);
  return Number.isNaN(n) ? EMPTY : `${signOf(n)}${formatUsd(n)}`;
};

/** 큰 원화 금액 축약 (차트 축용): 1.2억, 3,400만 */
export const formatKrwCompact = (value: Value): string => {
  const n = toNumber(value);
  if (Number.isNaN(n)) return EMPTY;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`;
  if (abs >= 1e4) return `${sign}${Math.round(abs / 1e4).toLocaleString('ko-KR')}만`;
  return `${sign}${Math.round(abs).toLocaleString('ko-KR')}`;
};

/** USD 환율: 1,380.25원 */
export const formatExchangeRate = (value: Value): string => {
  const n = toNumber(value);
  return Number.isNaN(n)
    ? EMPTY
    : `${n.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원`;
};

/** 'YYYY-MM' → '2026년 3월' */
export const formatMonth = (month: string): string => {
  const [y, m] = month.split('-');
  return `${y}년 ${Number(m)}월`;
};

/** 'YYYY-MM-DD' → '2026.03.05' */
export const formatDate = (date: string | null | undefined): string =>
  date ? date.replaceAll('-', '.') : EMPTY;

/** 0보다 큰 십진수 문자열 (백엔드 positiveDecimalString과 동일 규칙) */
export const isPositiveDecimal = (value: string): boolean =>
  /^\d+(\.\d+)?$/.test(value) && Number(value) > 0;

/** 한국 증시 관례: 상승 빨강, 하락 파랑 */
export const RISE_COLOR = '#E5383B';
export const FALL_COLOR = '#2F6FED';

export const profitColor = (value: Value): string | undefined => {
  const n = toNumber(value);
  if (Number.isNaN(n) || n === 0) return undefined;
  return n > 0 ? RISE_COLOR : FALL_COLOR;
};
