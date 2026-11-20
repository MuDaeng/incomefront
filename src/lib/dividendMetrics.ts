import type { DividendMetricsItem, DividendMetricsResponse } from '../api/types';
import { toNumber } from './format';

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
