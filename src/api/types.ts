import type { SecurityCompany } from '../lib/securityCompany';

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

/** GET /dividends: 지급월별 1주당 현금배당 합계 (지급 있는 달만, 월 오름차순) */
export interface SecurityMonthlyDividend {
  /** 지급월 YYYY-MM */
  month: string;
  /** 1주당 현금배당 합계 (KRW 정수, USD 소수 6자리) */
  amount: string;
  /** 그 달 지급 횟수 */
  count: number;
}

export interface SecurityMonthlyDividendResponse {
  security: SecurityInfo;
  months: SecurityMonthlyDividend[];
}

/* ---------- 관리자 ---------- */
/** 배치 실행 상태. RUNNING으로 남아 있으면 실행 중이거나 프로세스가 중간에 죽은 것 */
export type BatchStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

/** GET /admin/batch-histories 항목 (startedAt 최신순) */
export interface BatchHistoryItem {
  id: number;
  /** 잡 이름 (예: us-daily-prices) */
  name: string;
  status: BatchStatus;
  /** ISO 시각 */
  startedAt: string;
  /** 실행 중이면 null */
  finishedAt: string | null;
  durationMs: number | null;
  /** 성공: 잡 결과 JSON, 실패: 에러 메시지 (최대 10,000자) */
  result: string | null;
}

/**
 * GET /admin/security-searches/price 항목 (lastSearchDate 최신순, 같으면 securityId순).
 * 국내 종목 조회 때 KIS로 하루치 시세를 보충하며 남긴 기록
 */
export interface PriceSearchItem {
  /** 키 전용 (화면에는 보여 주지 않는다) */
  securityId: string;
  /** 백엔드 응답에 아직 없다. 추가되면 화면에 보여 준다 */
  symbol?: string | null;
  /** 종목 마스터에 없으면 null */
  name: string | null;
  /** 일별 시세를 마지막으로 확인한 날짜 'YYYY-MM-DD' (15:30 KST 전이면 어제, 후면 오늘) */
  lastSearchDate: string;
  /** ISO 시각 */
  createdAt: string;
  /** ISO 시각 */
  updatedAt: string;
}

/* ---------- 통합잔고 ---------- */
/** 증권사 하나의 보유 수량 (미매도 매수분 합). 수량 있는 증권사만, enum 순서 */
export interface CompanyAmount {
  securityCompany: SecurityCompany;
  amount: string;
}

export interface BalanceItem {
  securityId: string;
  /** 종목 심볼 (티커/종목코드) */
  symbol: string;
  name: string;
  currency: Currency;
  /** 총 보유 수량 (증권사별 수량의 합) */
  amount: string;
  /** 증권사별 보유 수량 (securityCompany 필터를 주면 그 증권사만) */
  companyAmounts: CompanyAmount[];
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
  /** 매수한 증권사 */
  securityCompany: SecurityCompany;
  amount: string;
  price: string;
  saleDate: string | null;
  exchangeRate: string | null;
  exchangeRateDate: string | null;
}

export interface PurchaseHistoryResponse {
  security: SecurityInfo;
  /** 총 보유 수량 (미매도 매수분 합, securityCompany 필터 적용) */
  amount: string;
  /** 증권사별 보유 수량 (미매도분, 수량 있는 증권사만, enum 순서) */
  companyAmounts: CompanyAmount[];
  items: PurchaseHistoryItem[];
}

export interface RegisterBalanceRequest {
  securityId: string;
  /** 매수한 증권사 (필수) */
  securityCompany: SecurityCompany;
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

/** 증권사별 일괄매도 (POST /balance/sale/bulk 본문). 그 증권사의 미매도 매수분 중 saleDate 이전(당일 포함) 매수분을 오래된 순으로 amount만큼 매도 */
export interface BulkSellBalanceRequest {
  securityId: string;
  securityCompany: SecurityCompany;
  amount: string;
  saleDate: string;
}

/** 매수 기록이 있는 증권사 목록 (GET /balance/security-companies). 중복 없음, 매도분 포함, enum 순서 */
export interface SecurityCompanyListResponse {
  securityCompanies: SecurityCompany[];
}

/** 매수분 하나의 증권사 수정 (PATCH /balance/purchases/security-company 본문) */
export interface UpdateSecurityCompanyRequest {
  securityId: string;
  purchaseDate: string;
  sequence: number;
  securityCompany: SecurityCompany;
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
