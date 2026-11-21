import type { Currency, DividendMetricsItem, DividendMetricsResponse } from '../api/types';
import { formatPrice, formatUsd, toNumber } from './format';

/** 예상 연배당(원화)의 월평균. 값이 없으면 NaN */
export const monthlyAverage = (krwAnnualDividend: string | number | null | undefined): number =>
  toNumber(krwAnnualDividend) / 12;

/** 원화 예상 연배당이 큰 순서 (같으면 원래 순서 유지) */
export const sortByAnnualDividend = (items: DividendMetricsItem[]): DividendMetricsItem[] =>
  [...items].sort((a, b) => toNumber(b.krwAnnualDividend) - toNumber(a.krwAnnualDividend));

/** 응답에서 종목 하나의 지표 (현재 보유하지 않으면 null) */
export const findMetricsItem = (
  data: DividendMetricsResponse | undefined,
  securityId: string,
): DividendMetricsItem | null => data?.items.find((i) => i.securityId === securityId) ?? null;

/** 최근 12개월 배당을 받은 종목 수 (예상 연배당 > 0) */
export const payingCount = (items: DividendMetricsItem[]): number =>
  items.filter((i) => toNumber(i.krwAnnualDividend) > 0).length;

/** 회당 평균 1주당 배당 (원화도 소수 2자리까지, 그 아래는 버림) */
const formatPerPayment = (amount: string, count: number, currency: Currency): string => {
  const avg = count > 0 ? toNumber(amount) / count : 0;
  return currency === 'KRW'
    ? `${(Math.trunc(avg * 100) / 100).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}원`
    : formatUsd(avg, 4);
};

/**
 * 배당 성장률 아래에 붙일 설명. 회당 평균으로 비교한 종목(상장 1년 남짓)은 그 평균을, 아니면 직전 12개월 합을 보여 준다.
 * growthBasis가 없으면(배포 전 백엔드) 합 비교로 본다.
 */
export const growthBasisNote = (
  item: Pick<
    DividendMetricsItem,
    'growthBasis' | 'trailingPerShare' | 'paymentCount' | 'previousPerShare' | 'previousPaymentCount'
  >,
  currency: Currency,
): string =>
  item.growthBasis === 'PER_PAYMENT'
    ? `상장 1년 미만 · 회당 평균 ${formatPerPayment(item.previousPerShare, item.previousPaymentCount, currency)} → ${formatPerPayment(item.trailingPerShare, item.paymentCount, currency)}`
    : `직전 12개월 ${formatPrice(item.previousPerShare, currency)}`;
