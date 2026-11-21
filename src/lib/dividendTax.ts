import type {
  DividendItem,
  DividendSumItem,
  DividendSummary,
  DividendSumSummary,
  TotalReturnItem,
  TotalReturnSummary,
} from '../api/types';

/**
 * 배당금 표시 기준. 세후는 백엔드가 일반 계좌 매수분만 원천징수(국내 15.4%, 미국 15%)를 뺀 값이고,
 * ISA·IRP·연금저축은 세후 = 세전이다.
 */
export type TaxMode = 'pre' | 'after';

export const TAX_MODE_LABEL: Record<TaxMode, string> = { pre: '세전', after: '세후' };

/** 배당 합계(월별·기간) 중 선택한 기준의 금액 */
export const dividendSummaryView = (s: DividendSummary, mode: TaxMode) =>
  mode === 'after'
    ? {
        krwAmount: s.afterTaxKrwAmount,
        usdAmount: s.afterTaxUsdAmount,
        usdKrwAmount: s.afterTaxUsdKrwAmount,
        totalKrwAmount: s.afterTaxTotalKrwAmount,
      }
    : {
        krwAmount: s.krwAmount,
        usdAmount: s.usdAmount,
        usdKrwAmount: s.usdKrwAmount,
        totalKrwAmount: s.totalKrwAmount,
      };

/** 배당 한 건 중 선택한 기준의 금액 (amount는 종목 통화) */
export const dividendItemView = (i: DividendItem, mode: TaxMode) =>
  mode === 'after'
    ? { amount: i.afterTaxAmount, usdAmount: i.afterTaxUsdAmount, krwAmount: i.afterTaxKrwAmount }
    : { amount: i.amount, usdAmount: i.usdAmount, krwAmount: i.krwAmount };

/** 기간 수익률의 종목별·전체 배당 합계 중 선택한 기준의 금액 */
export const dividendSumView = (i: DividendSumItem | DividendSumSummary, mode: TaxMode) =>
  mode === 'after'
    ? { usdAmount: i.afterTaxUsdAmount, krwAmount: i.afterTaxKrwAmount }
    : { usdAmount: i.usdAmount, krwAmount: i.krwAmount };

/** 기간 수익률 종합(종목별·전체) 중 선택한 기준의 배당·총액·수익금·수익률 */
export const totalReturnView = (t: TotalReturnItem | TotalReturnSummary, mode: TaxMode) =>
  mode === 'after'
    ? {
        dividendAmount: t.afterTaxDividendAmount,
        totalAmount: t.afterTaxTotalAmount,
        profit: t.afterTaxProfit,
        returnRate: t.afterTaxReturnRate,
      }
    : {
        dividendAmount: t.dividendAmount,
        totalAmount: t.totalAmount,
        profit: t.profit,
        returnRate: t.returnRate,
      };

/** 원화 세금 합계 = 세전 − 세후 총배당금 (표시용, 원 단위 정수) */
export const krwTaxAmount = (s: DividendSummary): number =>
  Math.max(0, Math.round(Number(s.totalKrwAmount) - Number(s.afterTaxTotalKrwAmount)));
