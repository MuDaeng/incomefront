/**
 * 백엔드(income API) 응답 타입.
 * 금액·수량·수익률은 모두 decimal 문자열 (KRW 정수, USD 소수 6자리, 수익률은 소수 2자리 %).
 */
export type Currency = 'KRW' | 'USD';

export interface User {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

/* ---------- 종목 / 시세 ---------- */
export interface SecuritySearchItem {
  id: string;
  symbol: string;
  name: string;
  currency: Currency;
  closingPrice: string | null;
  priceDate: string | null;
}

export interface SecurityInfo {
  id: string;
  symbol: string;
  name: string;
  currency: Currency;
}

export interface DailyPrice {
  date: string;
  openingPrice: string;
  closingPrice: string;
  highestPrice: string;
  lowestPrice: string;
}

export interface DailyPriceResponse {
  security: SecurityInfo;
  from: string | null;
  to: string | null;
  prices: DailyPrice[];
}

/* ---------- 통합잔고 ---------- */
export interface BalanceItem {
  securityId: string;
  name: string;
  currency: Currency;
  amount: string;
  currentPrice: string;
  krwAveragePrice: string;
  usdAveragePrice: string | null;
  krwPurchaseAmount: string;
  usdPurchaseAmount: string | null;
  krwEvaluationAmount: string;
  usdEvaluationAmount: string | null;
  returnRate: string;
}

export interface BalanceSummary {
  purchaseAmount: string;
  evaluationAmount: string;
  returnRate: string;
}

export interface UsdBalanceSummary {
  usdPurchaseAmount: string;
  usdEvaluationAmount: string;
  krwPurchaseAmount: string;
  krwEvaluationAmount: string;
  returnRate: string;
}

export interface IntegratedBalanceResponse {
  items: BalanceItem[];
  krwTotal: BalanceSummary;
  usdTotal: UsdBalanceSummary;
  total: BalanceSummary;
  exchangeRate: string | null;
  exchangeRateDate: string | null;
}

/* ---------- 매수 / 매도 ---------- */
export interface PurchaseHistoryItem {
  purchaseDate: string;
  sequence: number;
  amount: string;
  price: string;
  saleDate: string | null;
  exchangeRate: string | null;
  exchangeRateDate: string | null;
}

export interface PurchaseHistoryResponse {
  security: SecurityInfo;
  items: PurchaseHistoryItem[];
}

export interface RegisterBalanceRequest {
  securityId: string;
  purchaseDate: string;
  amount: string;
  price: string;
  saleDate?: string | null;
  /** 구매 환율(1 USD당 원화). KRW 종목은 무시, USD에서 생략하면 매수일(이전 최근) USD 종가 환율 */
  exchangeRate?: string | null;
}

export interface SellBalanceRequest {
  securityId: string;
  purchaseDate: string;
  sequence: number;
  amount: string;
  saleDate: string;
}

/** 잘못 등록한 매수분 하나 삭제 (DELETE /balance/purchases 쿼리) */
export interface DeletePurchaseRequest {
  securityId: string;
  purchaseDate: string;
  sequence: number;
}

/** 매수분 하나의 구매 환율 수정 (PATCH /balance/purchases 본문). null이면 저장 환율 삭제 */
export interface UpdateExchangeRateRequest {
  securityId: string;
  purchaseDate: string;
  sequence: number;
  exchangeRate: string | null;
}

/* ---------- 월별 추이 (GET /balance/monthly) — 금액은 모두 원화 정수 decimal 문자열 ---------- */
export interface MonthlyBalanceTotal {
  /** 원금 */
  purchaseAmount: string;
  /** 평가금액 (기준일 종가 × 수량, USD는 기준일 환율) */
  evaluationAmount: string;
  /** 누적배당금: 처음부터 기준일까지 지급된 배당금 합계 (from 이전 포함) */
  dividendAmount: string;
  /** 평가금액 + 누적배당금 */
  totalAmount: string;
}

export interface MonthlyBalanceItem extends MonthlyBalanceTotal {
  securityId: string;
  name: string;
  currency: Currency;
  /** 기준일 보유 수량 (매도 후 배당만 남은 종목은 0) */
  quantity: string;
}

export interface MonthlyBalanceMonth {
  /** 'YYYY-MM' */
  month: string;
  /** 평가 기준일 'YYYY-MM-DD' (월말, 이번 달이면 오늘) */
  date: string;
  total: MonthlyBalanceTotal;
  /** 기준일 보유 종목 ∪ 누적배당금이 있는 종목, 종목 코드 순 */
  items: MonthlyBalanceItem[];
}

export interface MonthlyBalanceResponse {
  from: string;
  to: string;
  /** 오래된 달부터 */
  months: MonthlyBalanceMonth[];
}

/* ---------- 배당 ---------- */
export interface DividendItem {
  securityId: string;
  name: string;
  currency: Currency;
  noticeDate: string;
  paymentDate: string;
  perShareAmount: string;
  quantity: string;
  amount: string;
  usdAmount: string | null;
  krwAmount: string | null;
  exchangeRate: string | null;
  exchangeRateDate: string | null;
}

export interface DividendSummary {
  krwAmount: string;
  usdAmount: string;
  usdKrwAmount: string;
  totalKrwAmount: string;
}

export interface MonthlyDividend {
  month: string;
  summary: DividendSummary;
  items: DividendItem[];
}

export interface DividendHistoryResponse {
  from: string | null;
  to: string | null;
  total: DividendSummary;
  months: MonthlyDividend[];
}

/* ---------- 기간 수익률 ---------- */
export interface EvaluationItem {
  securityId: string;
  name: string;
  currency: Currency;
  quantity: string;
  closingPrice: string | null;
  priceDate: string | null;
  usdPurchaseAmount: string | null;
  usdEvaluationAmount: string | null;
  krwPurchaseAmount: string;
  krwEvaluationAmount: string;
  profit: string;
  returnRate: string;
}

export interface EvaluationSummary {
  purchaseAmount: string;
  evaluationAmount: string;
  profit: string;
  returnRate: string;
}

export interface DividendSumItem {
  securityId: string;
  name: string;
  currency: Currency;
  usdAmount: string | null;
  krwAmount: string;
}

export interface TotalReturnItem {
  securityId: string;
  name: string;
  purchaseAmount: string;
  evaluationAmount: string;
  dividendAmount: string;
  totalAmount: string;
  profit: string;
  returnRate: string;
}

export interface TotalReturnSummary {
  purchaseAmount: string;
  evaluationAmount: string;
  dividendAmount: string;
  totalAmount: string;
  profit: string;
  returnRate: string;
}

export interface PeriodReturnResponse {
  from: string;
  to: string;
  exchangeRate: string | null;
  exchangeRateDate: string | null;
  evaluation: { items: EvaluationItem[]; total: EvaluationSummary };
  dividend: {
    items: DividendSumItem[];
    total: { usdAmount: string; krwAmount: string };
  };
  total: { items: TotalReturnItem[]; total: TotalReturnSummary };
}
