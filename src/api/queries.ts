import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { SecurityCompany } from '../lib/securityCompany';
import { request } from './client';
import type {
  BatchHistoryItem,
  BatchStatus,
  BulkRegisterTossRequest,
  BulkRegisterTossResponse,
  BulkSellBalanceRequest,
  DailyPriceResponse,
  DeletePurchaseRequest,
  DividendHistoryResponse,
  DividendMetricsResponse,
  MonthlyBalanceResponse,
  IntegratedBalanceResponse,
  PeriodReturnResponse,
  PriceSearchItem,
  PurchaseHistoryResponse,
  RegisterBalanceRequest,
  SecurityCompanyListResponse,
  SecurityMonthlyDividendResponse,
  SecuritySearchItem,
  SellBalanceRequest,
  UpdateExchangeRateRequest,
  UpdateSecurityCompanyRequest,
  User,
} from './types';

export const fetchMe = () => request<User>('/auth/me');

/** 잔고가 바뀌면 함께 무효화할 쿼리의 공통 prefix */
const BALANCE_KEY = ['balance'] as const;

export const queryKeys = {
  integratedBalance: (securityCompany?: SecurityCompany) =>
    [...BALANCE_KEY, 'integrated', securityCompany ?? null] as const,
  purchases: (securityId: string, securityCompany?: SecurityCompany) =>
    [...BALANCE_KEY, 'purchases', securityId, securityCompany ?? null] as const,
  dividends: (from?: string, to?: string, securityCompany?: SecurityCompany) =>
    [...BALANCE_KEY, 'dividends', from ?? null, to ?? null, securityCompany ?? null] as const,
  returns: (from: string, to: string, securityCompany?: SecurityCompany) =>
    [...BALANCE_KEY, 'returns', from, to, securityCompany ?? null] as const,
  monthly: (from: string, to: string, securityCompany?: SecurityCompany) =>
    [...BALANCE_KEY, 'monthly', from, to, securityCompany ?? null] as const,
  dividendMetrics: (securityCompany?: SecurityCompany) =>
    [...BALANCE_KEY, 'dividend-metrics', securityCompany ?? null] as const,
  securityCompanies: [...BALANCE_KEY, 'security-companies'] as const,
  securitySearch: (keyword: string) => ['securities', keyword] as const,
  dailyPrices: (securityId: string, from?: string, to?: string) =>
    ['daily-prices', securityId, from ?? null, to ?? null] as const,
  /** 종목 월별 1주당 배당 (잔고와 무관해서 balance prefix를 쓰지 않는다) */
  securityDividends: (securityId: string) => ['securities', securityId, 'dividends'] as const,
  /** 관리자 배치 이력 (잔고와 무관) */
  batchHistories: (name: string | undefined, status: BatchStatus | undefined, limit: number) =>
    ['admin', 'batch-histories', name ?? null, status ?? null, limit] as const,
  /** 관리자 종목별 일별 시세 조회 이력 (잔고와 무관) */
  priceSearches: ['admin', 'security-searches', 'price'] as const,
};

/** 통합잔고. securityCompany를 주면 그 증권사 매수분만, 없으면 전체 */
export const useIntegratedBalance = (securityCompany?: SecurityCompany) =>
  useQuery({
    queryKey: queryKeys.integratedBalance(securityCompany),
    queryFn: ({ signal }) =>
      request<IntegratedBalanceResponse>('/balance', {
        query: { securityCompany },
        signal,
      }),
    // 필터를 바꿀 때 화면 전체가 로딩으로 바뀌지 않도록 이전 결과를 유지
    placeholderData: keepPreviousData,
  });

/** 종목 매수 내역. securityCompany를 주면 그 증권사 매수분만, 없으면 전체 */
export const usePurchases = (securityId: string, securityCompany?: SecurityCompany) =>
  useQuery({
    queryKey: queryKeys.purchases(securityId, securityCompany),
    queryFn: ({ signal }) =>
      request<PurchaseHistoryResponse>('/balance/purchases', {
        query: { securityId, securityCompany },
        signal,
      }),
    enabled: !!securityId,
    placeholderData: keepPreviousData,
  });

/** 배당금 내역. securityCompany를 주면 그 증권사 보유 수량으로만 계산 */
export const useDividendHistory = (from?: string, to?: string, securityCompany?: SecurityCompany) =>
  useQuery({
    queryKey: queryKeys.dividends(from, to, securityCompany),
    queryFn: ({ signal }) =>
      request<DividendHistoryResponse>('/balance/dividends', {
        query: { from, to, securityCompany },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

/** 현재 보유 종목의 배당 지표(예상 연배당·YOC·현재 배당률·성장률, 세전). securityCompany를 주면 그 증권사 보유분만 */
export const useDividendMetrics = (securityCompany?: SecurityCompany) =>
  useQuery({
    queryKey: queryKeys.dividendMetrics(securityCompany),
    queryFn: ({ signal }) =>
      request<DividendMetricsResponse>('/balance/dividend-metrics', {
        query: { securityCompany },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

/** 기간 수익률. securityCompany를 주면 그 증권사 매수분·보유 수량으로만 계산 */
export const usePeriodReturn = (from: string, to: string, securityCompany?: SecurityCompany) =>
  useQuery({
    queryKey: queryKeys.returns(from, to, securityCompany),
    queryFn: ({ signal }) =>
      request<PeriodReturnResponse>('/balance/returns', {
        query: { from, to, securityCompany },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

/** 월말별 원금·평가금액·누적배당금 (from/to는 'YYYY-MM', to는 이번 달까지, 최대 120개월) */
export const useMonthlyBalance = (
  from: string,
  to: string,
  enabled = true,
  securityCompany?: SecurityCompany,
) =>
  useQuery({
    queryKey: queryKeys.monthly(from, to, securityCompany),
    enabled,
    queryFn: ({ signal }) =>
      request<MonthlyBalanceResponse>('/balance/monthly', {
        query: { from, to, securityCompany },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

export const useSecuritySearch = (keyword: string) =>
  useQuery({
    queryKey: queryKeys.securitySearch(keyword),
    queryFn: ({ signal }) =>
      request<SecuritySearchItem[]>('/securities', {
        query: { keyword },
        signal,
      }),
    enabled: keyword.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

export const useDailyPrices = (
  securityId: string | undefined,
  from?: string,
  to?: string,
) =>
  useQuery({
    queryKey: queryKeys.dailyPrices(securityId ?? '', from, to),
    queryFn: ({ signal }) =>
      request<DailyPriceResponse>('/daily-securities', {
        query: { securityId, from, to },
        signal,
      }),
    enabled: !!securityId,
    staleTime: 10 * 60 * 1000,
  });

/** GET /dividends (로그인 불필요, 30회/분): 종목의 지급월별 1주당 현금배당 합계 */
export const useSecurityDividends = (securityId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.securityDividends(securityId ?? ''),
    queryFn: ({ signal }) =>
      request<SecurityMonthlyDividendResponse>('/dividends', {
        query: { securityId },
        signal,
      }),
    enabled: !!securityId,
    staleTime: 10 * 60 * 1000,
  });

export const useRegisterBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterBalanceRequest) =>
      request('/balance', { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

export const useSellBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SellBalanceRequest) =>
      request('/balance/sale', { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/** 증권사별 일괄매도. 보유 수량이 모자라면 백엔드가 400을 주고 아무것도 매도하지 않는다 */
export const useBulkSellBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkSellBalanceRequest) =>
      request('/balance/sale/bulk', { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/**
 * Toss 거래내역으로 TOSS 증권사 잔고 일괄 재등록. 기존 TOSS 매수분을 모두 지우고 다시 등록하며,
 * 매도할 보유 수량이 모자라면 400으로 전체가 롤백된다
 */
export const useBulkRegisterToss = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkRegisterTossRequest) =>
      request<BulkRegisterTossResponse>('/balance/toss', { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/** 오등록한 매수분 하나 삭제. 그 종목의 매수분이 모두 지워지면 백엔드가 보유 종목에서도 제거한다 */
export const useDeletePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ securityId, purchaseDate, sequence }: DeletePurchaseRequest) =>
      request('/balance/purchases', {
        method: 'DELETE',
        query: { securityId, purchaseDate, sequence },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/**
 * 매수분 하나의 구매 환율 수정 (USD 종목만). exchangeRate가 null이면 저장 환율을 지워
 * 조회 시 매수일 환율로 돌아간다. 원화 원금이 바뀌므로 balance 전체를 무효화한다
 */
export const useUpdateExchangeRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateExchangeRateRequest) =>
      request('/balance/purchases', { method: 'PATCH', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/** 매수분 하나의 증권사 수정. 증권사 필터 결과가 바뀌므로 balance 전체를 무효화한다 */
export const useUpdateSecurityCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSecurityCompanyRequest) =>
      request('/balance/purchases/security-company', { method: 'PATCH', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/** 매수 기록이 있는 증권사 목록 (필터 콤보박스용). balance 키 아래라 등록·삭제·증권사 수정 뒤 함께 갱신 */
export const useSecurityCompanies = () =>
  useQuery({
    queryKey: queryKeys.securityCompanies,
    queryFn: ({ signal }) =>
      request<SecurityCompanyListResponse>('/balance/security-companies', { signal }),
    select: (data) => data.securityCompanies,
  });

/** GET /admin/batch-histories (관리자 전용, 아니면 403). name·status 생략 = 전체, limit 1~100 */
export const useBatchHistories = (params: {
  name?: string;
  status?: BatchStatus;
  limit: number;
}) =>
  useQuery({
    queryKey: queryKeys.batchHistories(params.name, params.status, params.limit),
    queryFn: ({ signal }) =>
      request<BatchHistoryItem[]>('/admin/batch-histories', {
        query: { name: params.name, status: params.status, limit: params.limit },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

/** GET /admin/security-searches/price (관리자 전용, 아니면 403). 파라미터 없이 전체를 한 번에 돌려준다 */
export const usePriceSearches = () =>
  useQuery({
    queryKey: queryKeys.priceSearches,
    queryFn: ({ signal }) =>
      request<PriceSearchItem[]>('/admin/security-searches/price', { signal }),
  });
