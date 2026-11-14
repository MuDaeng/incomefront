import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { SecurityCompany } from '../lib/securityCompany';
import { request } from './client';
import type {
  DailyPriceResponse,
  DeletePurchaseRequest,
  DividendHistoryResponse,
  MonthlyBalanceResponse,
  IntegratedBalanceResponse,
  PeriodReturnResponse,
  PurchaseHistoryResponse,
  RegisterBalanceRequest,
  SecuritySearchItem,
  SellBalanceRequest,
  UpdateExchangeRateRequest,
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
  dividends: (from?: string, to?: string) =>
    [...BALANCE_KEY, 'dividends', from ?? null, to ?? null] as const,
  returns: (from: string, to: string) =>
    [...BALANCE_KEY, 'returns', from, to] as const,
  monthly: (from: string, to: string) =>
    [...BALANCE_KEY, 'monthly', from, to] as const,
  securitySearch: (keyword: string) => ['securities', keyword] as const,
  dailyPrices: (securityId: string, from?: string, to?: string) =>
    ['daily-prices', securityId, from ?? null, to ?? null] as const,
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

export const useDividendHistory = (from?: string, to?: string) =>
  useQuery({
    queryKey: queryKeys.dividends(from, to),
    queryFn: ({ signal }) =>
      request<DividendHistoryResponse>('/balance/dividends', {
        query: { from, to },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

export const usePeriodReturn = (from: string, to: string) =>
  useQuery({
    queryKey: queryKeys.returns(from, to),
    queryFn: ({ signal }) =>
      request<PeriodReturnResponse>('/balance/returns', {
        query: { from, to },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

/** 월말별 원금·평가금액·누적배당금 (from/to는 'YYYY-MM', to는 이번 달까지, 최대 120개월) */
export const useMonthlyBalance = (from: string, to: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.monthly(from, to),
    enabled,
    queryFn: ({ signal }) =>
      request<MonthlyBalanceResponse>('/balance/monthly', {
        query: { from, to },
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
