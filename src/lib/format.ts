import type { Currency } from '../api/types';

type Value = string | number | null | undefined;

export const toNumber = (value: Value): number =>
  value === null || value === undefined || value === '' ? NaN : Number(value);

const EMPTY = '-';

/** 원화: 정수, 천 단위 구분 */
export const formatKrw = (value: Value): string => {
  const n = toNumber(value);
  return Number.isNaN(n) ? EMPTY : `${Math.trunc(n).toLocaleString('ko-KR')}원`;
};

/** 달러: 기본 소수 2자리 */
export const formatUsd = (value: Value, maxDigits = 2): string => {
  const n = toNumber(value);
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
