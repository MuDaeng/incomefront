import type { AccountType } from '../lib/account';
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

/* ---------- 계좌 ---------- */
/** GET /accounts 항목. id는 사용자별 순번 */
export interface Account {
  id: number;
  securityCompany: SecurityCompany;
  accountType: AccountType;
}

export interface AccountListResponse {
  /** id 순 */
  accounts: Account[];
}

/** POST /accounts 본문. accountType을 생략하면 일반(NORMAL) */
export interface CreateAccountRequest {
  securityCompany: SecurityCompany;
  accountType?: AccountType;
}

/* ---------- 통합잔고 ---------- */
/** 계좌 하나의 보유 수량 (미매도 매수분 합). 수량 있는 계좌만, 계좌 id 순 */
export interface AccountAmount {
  accountId: number;
  securityCompany: SecurityCompany;
  accountType: AccountType;
  amount: string;
}

export interface BalanceItem {
  securityId: string;
  /** 종목 심볼 (티커/종목코드) */
  symbol: string;
  name: string;
  currency: Currency;
  /** 총 보유 수량 (계좌별 수량의 합) */
  amount: string;
  /** 계좌별 보유 수량 (accountId 필터를 주면 그 계좌만) */
  accountAmounts: AccountAmount[];
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
  /** 매수한 계좌 */
  accountId: number;
  /** 계좌의 증권사 */
  securityCompany: SecurityCompany;
  accountType: AccountType;
  amount: string;
  price: string;
  saleDate: string | null;
  exchangeRate: string | null;
  exchangeRateDate: string | null;
}

export interface PurchaseHistoryResponse {
  security: SecurityInfo;
  /** 총 보유 수량 (미매도 매수분 합, accountId 필터 적용) */
  amount: string;
  /** 계좌별 보유 수량 (미매도분, 수량 있는 계좌만, 계좌 id 순) */
  accountAmounts: AccountAmount[];
  items: PurchaseHistoryItem[];
}

export interface RegisterBalanceRequest {
  securityId: string;
  /** 매수한 증권사 (필수) */
  securityCompany: SecurityCompany;
  /** 매수한 내 계좌. 생략하면 그 증권사의 첫 계좌, 없으면 일반 계좌를 새로 만든다 */
  accountId?: number;
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

/** 계좌별 일괄매도 (POST /balance/sale/bulk 본문). 그 계좌의 미매도 매수분 중 saleDate 이전(당일 포함) 매수분을 최근 순(LIFO)으로 amount만큼 매도 */
export interface BulkSellBalanceRequest {
  securityId: string;
  securityCompany: SecurityCompany;
  /** 생략하면 그 증권사의 첫 계좌 */
  accountId?: number;
  amount: string;
  saleDate: string;
}

/**
 * Toss 거래내역 한 건 (POST /balance/toss). 금액·수량은 `currency` 통화의 부호 없는 decimal 문자열.
 * enum 필드는 Toss가 값을 늘릴 수 있어 백엔드가 모르는 문자열도 받으므로 string
 */
export interface TossTransaction {
  /** BUY · SELL · SECURITIES_TRANSFER_IN · SECURITIES_TRANSFER_OUT · DEPOSIT · DIVIDEND … */
  transactionType: string;
  /** KR | US */
  marketCountry: string;
  /** KRW | USD */
  currency: string;
  symbol: string | null;
  /** STOCK | BOND | OPTION */
  assetClass: string | null;
  isinCode: string | null;
  quantity: string | null;
  filledPrice: string | null;
  exchangeRate: string | null;
  /** KST 결제일 'YYYY-MM-DD' */
  settlementDate: string;
  settled: boolean;
  /** ISO 8601. 미결제는 null */
  transactionTime: string | null;
  isCancellation: boolean;
}

/** 출고 한 건의 키 (거래 id가 없어 ISIN·결제일·수량·순번으로 구분). 서버가 준 값을 그대로 돌려보낸다 */
export interface TossTransferKey {
  isinCode: string;
  settlementDate: string;
  quantity: string;
  /** 같은 (ISIN, 결제일, 수량) 출고 안에서의 순번 (0부터, 처리일시 순) */
  index: number;
}

export interface BulkRegisterTossRequest {
  /** 등록할 내 Toss 계좌. 생략하면 첫 Toss 계좌, 없으면 일반 계좌를 새로 만든다 */
  accountId?: number;
  transactionList: TossTransaction[];
  /** 매도로 처리할 출고(실제로 나간 주식). 출고는 기본으로 주식 빌려주기로 보고 매도하지 않는다 */
  confirmedTransfersOut?: TossTransferKey[];
}

export interface TossSkippedTransaction {
  transactionType: string;
  isinCode: string | null;
  reason: string;
}

/** 아직 반환되지 않은 빌려주기 출고 (대여 중으로 보고 매도하지 않은 출고) */
export interface TossLentTransfer {
  key: TossTransferKey;
  /** 아직 반환되지 않은 수량 (부분 반환이면 출고 수량보다 적다) */
  remainingQuantity: string;
}

/** POST /balance/toss 결과 */
export interface BulkRegisterTossResponse {
  /** 등록한 계좌 id */
  accountId: number;
  /** 삭제한 그 계좌의 기존 매수분(매도분 포함) 행 수 */
  deletedCount: number;
  /** 등록한 BUY·SECURITIES_TRANSFER_IN 거래 수 (빌려주기 반환으로 전량 상쇄된 입고 제외) */
  boughtCount: number;
  /** 매도 처리한 SELL·실제 출고(confirmedTransfersOut) 거래 수 */
  soldCount: number;
  skipped: TossSkippedTransaction[];
  /** 대여 중으로 보고 무시한 출고 */
  lentTransfers: TossLentTransfer[];
}

/** 매수분 하나를 내 다른 계좌로 이동 (PATCH /balance/purchases/account 본문) */
export interface UpdatePurchaseAccountRequest {
  securityId: string;
  purchaseDate: string;
  sequence: number;
  accountId: number;
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
  /** 배당 기준일 */
  noticeDate: string;
  /** 배당락일. 전날까지 매수, 이 날 이후(당일 포함) 매도한 수량으로 계산. 예전에 저장된 배당은 null(기준일 보유로 계산) */
  exDividendDate?: string | null;
  paymentDate: string;
  perShareAmount: string;
  quantity: string;
  amount: string;
  usdAmount: string | null;
  krwAmount: string | null;
  /** 세금 (종목 통화). 일반 계좌 매수분에만 KRW 15.4%·USD 15%, ISA·IRP·연금저축은 0 */
  taxAmount: string;
  /** 세후 배당금 (종목 통화) = amount − taxAmount */
  afterTaxAmount: string;
  /** 세후 달러 배당금 (KRW 종목은 null) */
  afterTaxUsdAmount: string | null;
  /** 세후 원화 배당금 (USD는 지급일 환율 환산, 환율이 없으면 null) */
  afterTaxKrwAmount: string | null;
  exchangeRate: string | null;
  exchangeRateDate: string | null;
}

export interface DividendSummary {
  krwAmount: string;
  usdAmount: string;
  usdKrwAmount: string;
  totalKrwAmount: string;
  afterTaxKrwAmount: string;
  afterTaxUsdAmount: string;
  afterTaxUsdKrwAmount: string;
  afterTaxTotalKrwAmount: string;
}

export interface MonthlyDividend {
  month: string;
  summary: DividendSummary;
  items: DividendItem[];
}

/** GET /balance/dividend-metrics 종목별 배당 지표 (세전). 비율은 % 소수 2자리 */
export interface DividendMetricsItem {
  securityId: string;
  symbol: string;
  name: string;
  currency: Currency;
  /** 현재 보유 수량 */
  quantity: string;
  /** 최근 12개월 지급된 주당 현금배당 합 (종목 통화) */
  trailingPerShare: string;
  /** 최근 12개월 지급 횟수 */
  paymentCount: number;
  /** 그 직전 12개월 주당 배당 합 (종목 통화) */
  previousPerShare: string;
  /** 배당 성장률(%) = 최근 12개월 ÷ 직전 12개월 − 1. 직전 배당이 없으면 null */
  growthRate: string | null;
  /** 예상 연배당 (종목 통화) = 최근 12개월 주당 배당 × 현재 수량 */
  annualDividend: string;
  /** 예상 연배당 (원화, USD는 최신 환율) */
  krwAnnualDividend: string;
  /** 현재 보유분 원금 (원화) */
  krwPurchaseAmount: string;
  closingPrice: string | null;
  priceDate: string | null;
  krwEvaluationAmount: string | null;
  /** 매입가 대비 배당률(%) */
  yieldOnCost: string | null;
  /** 현재 배당률(%) = 최근 12개월 주당 배당 ÷ 최신 종가 */
  currentYield: string | null;
}

export interface DividendMetricsTotal {
  krwAnnualDividend: string;
  krwPurchaseAmount: string;
  krwEvaluationAmount: string;
  yieldOnCost: string | null;
  currentYield: string | null;
}

export interface DividendMetricsResponse {
  /** 기준일 (한국 시간 오늘) */
  date: string;
  exchangeRate: string | null;
  exchangeRateDate: string | null;
  /** 현재 보유 종목, 종목 코드 순 */
  items: DividendMetricsItem[];
  total: DividendMetricsTotal;
}

/** 지급 예정 배당 (지급일이 오늘(한국 시간) 이후, 기간 안). total·months에는 들어가지 않는다 */
export interface ScheduledDividends {
  total: DividendSummary;
  /** 지급일·종목 순 */
  items: DividendItem[];
}

export interface DividendHistoryResponse {
  from: string | null;
  to: string | null;
  /** 기간 총배당금 (지급일이 오늘 이하인 지급분만) */
  total: DividendSummary;
  /** 월별 배당 내역 (월 오름차순, 지급분만) */
  months: MonthlyDividend[];
  scheduled: ScheduledDividends;
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
  /** 기간 세후 달러 배당금 (KRW 종목은 null) */
  afterTaxUsdAmount: string | null;
  /** 기간 세후 원화 배당금 (일반 계좌만 과세) */
  afterTaxKrwAmount: string;
}

export interface DividendSumSummary {
  usdAmount: string;
  krwAmount: string;
  afterTaxUsdAmount: string;
  afterTaxKrwAmount: string;
}

/** 세후 필드: 평가금액은 같고 배당만 세후 */
export interface AfterTaxReturnFields {
  afterTaxDividendAmount: string;
  /** 평가금액 + 세후 배당금 */
  afterTaxTotalAmount: string;
  afterTaxProfit: string;
  afterTaxReturnRate: string;
}

export interface TotalReturnItem extends AfterTaxReturnFields {
  securityId: string;
  name: string;
  purchaseAmount: string;
  evaluationAmount: string;
  dividendAmount: string;
  totalAmount: string;
  profit: string;
  returnRate: string;
}

export interface TotalReturnSummary extends AfterTaxReturnFields {
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
    total: DividendSumSummary;
  };
  total: { items: TotalReturnItem[]; total: TotalReturnSummary };
}
