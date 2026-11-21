import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { SecurityCompany } from '../lib/securityCompany';
import { request } from './client';
import type {
  Account,
  AccountListResponse,
  BatchHistoryItem,
  BatchStatus,
  BulkRegisterTossRequest,
  BulkRegisterTossResponse,
  BulkSellBalanceRequest,
  CreateAccountRequest,
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
  SecurityMonthlyDividendResponse,
  SecuritySearchItem,
  SellBalanceRequest,
  UpdateExchangeRateRequest,
  UpdatePurchaseAccountRequest,
  User,
} from './types';

export const fetchMe = () => request<User>('/auth/me');

/** 잔고가 바뀌면 함께 무효화할 쿼리의 공통 prefix */
const BALANCE_KEY = ['balance'] as const;

export const queryKeys = {
  integratedBalance: (accountId?: number) =>
    [...BALANCE_KEY, 'integrated', accountId ?? null] as const,
  purchases: (securityId: string, accountId?: number) =>
    [...BALANCE_KEY, 'purchases', securityId, accountId ?? null] as const,
  dividends: (from?: string, to?: string, accountId?: number) =>
    [...BALANCE_KEY, 'dividends', from ?? null, to ?? null, accountId ?? null] as const,
  returns: (from: string, to: string, accountId?: number) =>
    [...BALANCE_KEY, 'returns', from, to, accountId ?? null] as const,
  monthly: (from: string, to: string, accountId?: number) =>
    [...BALANCE_KEY, 'monthly', from, to, accountId ?? null] as const,
  dividendMetrics: (accountId?: number) =>
    [...BALANCE_KEY, 'dividend-metrics', accountId ?? null] as const,
  /** 내 계좌 목록. 매수 등록·일괄등록이 계좌를 새로 만들 수 있어 balance prefix 아래에 둔다 */
  accounts: (securityCompany?: SecurityCompany) =>
    [...BALANCE_KEY, 'accounts', securityCompany ?? null] as const,
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

/** 통합잔고. accountId를 주면 그 계좌 매수분만, 없으면 전체 */
export const useIntegratedBalance = (accountId?: number) =>
  useQuery({
    queryKey: queryKeys.integratedBalance(accountId),
    queryFn: ({ signal }) =>
      request<IntegratedBalanceResponse>('/balance', {
        query: { accountId },
        signal,
      }),
    // 필터를 바꿀 때 화면 전체가 로딩으로 바뀌지 않도록 이전 결과를 유지
    placeholderData: keepPreviousData,
  });

/** 종목 매수 내역. accountId를 주면 그 계좌 매수분만, 없으면 전체 */
export const usePurchases = (securityId: string, accountId?: number) =>
  useQuery({
    queryKey: queryKeys.purchases(securityId, accountId),
    queryFn: ({ signal }) =>
      request<PurchaseHistoryResponse>('/balance/purchases', {
        query: { securityId, accountId },
        signal,
      }),
    enabled: !!securityId,
    placeholderData: keepPreviousData,
  });

/** 배당금 내역. accountId를 주면 그 계좌 보유 수량으로만 계산 */
export const useDividendHistory = (from?: string, to?: string, accountId?: number) =>
  useQuery({
    queryKey: queryKeys.dividends(from, to, accountId),
    queryFn: ({ signal }) =>
      request<DividendHistoryResponse>('/balance/dividends', {
        query: { from, to, accountId },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

/** 현재 보유 종목의 배당 지표(예상 연배당·YOC·현재 배당률·성장률, 세전). accountId를 주면 그 계좌 보유분만 */
export const useDividendMetrics = (accountId?: number) =>
  useQuery({
    queryKey: queryKeys.dividendMetrics(accountId),
    queryFn: ({ signal }) =>
      request<DividendMetricsResponse>('/balance/dividend-metrics', {
        query: { accountId },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

/** 기간 수익률. accountId를 주면 그 계좌 매수분·보유 수량으로만 계산 */
export const usePeriodReturn = (from: string, to: string, accountId?: number) =>
  useQuery({
    queryKey: queryKeys.returns(from, to, accountId),
    queryFn: ({ signal }) =>
      request<PeriodReturnResponse>('/balance/returns', {
        query: { from, to, accountId },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

/** 월말별 원금·평가금액·누적배당금 (from/to는 'YYYY-MM', to는 이번 달까지, 최대 120개월) */
export const useMonthlyBalance = (
  from: string,
  to: string,
  enabled = true,
  accountId?: number,
) =>
  useQuery({
    queryKey: queryKeys.monthly(from, to, accountId),
    enabled,
    queryFn: ({ signal }) =>
      request<MonthlyBalanceResponse>('/balance/monthly', {
        query: { from, to, accountId },
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

/** 계좌별 일괄매도. 보유 수량이 모자라면 백엔드가 400을 주고 아무것도 매도하지 않는다 */
export const useBulkSellBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkSellBalanceRequest) =>
      request('/balance/sale/bulk', { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/**
 * Toss 거래내역으로 Toss 계좌 잔고 일괄 재등록. 그 계좌의 기존 매수분을 모두 지우고 다시 등록하며,
 * 매도할 보유 수량이 모자라면 400으로 전체가 롤백된다. 출고는 confirmedTransfersOut에 없으면 빌려주기로 본다
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

/** 매수분 하나를 내 다른 계좌로 이동 (매도분도 가능). 계좌 필터 결과가 바뀌므로 balance 전체를 무효화한다 */
export const useUpdatePurchaseAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePurchaseAccountRequest) =>
      request('/balance/purchases/account', { method: 'PATCH', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/** 내 계좌 목록 (id 순). securityCompany를 주면 그 증권사 계좌만 */
export const useAccounts = (securityCompany?: SecurityCompany, enabled = true) =>
  useQuery({
    queryKey: queryKeys.accounts(securityCompany),
    queryFn: ({ signal }) =>
      request<AccountListResponse>('/accounts', { query: { securityCompany }, signal }),
    select: (data) => data.accounts,
    enabled,
  });

/** 계좌 생성 (accountType 생략 = 일반) */
export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAccountRequest) =>
      request<Account>('/accounts', { method: 'POST', body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/** 계좌 타입 변경. 잔고 응답의 accountAmounts에도 타입이 있어 balance 전체를 무효화한다 */
export const useUpdateAccountType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accountType }: Pick<Account, 'id' | 'accountType'>) =>
      request<Account>(`/accounts/${id}/type`, { method: 'PATCH', body: { accountType } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

/** 계좌 삭제 (204). 매수 내역(매도분 포함)이 남아 있으면 400 */
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request(`/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BALANCE_KEY }),
  });
};

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
