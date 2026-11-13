import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { request } from './client';
import type {
  DailyPriceResponse,
  DividendHistoryResponse,
  IntegratedBalanceResponse,
  PeriodReturnResponse,
  PurchaseHistoryResponse,
  RegisterBalanceRequest,
  SecuritySearchItem,
  SellBalanceRequest,
  User,
} from './types';

export const fetchMe = () => request<User>('/auth/me');

/** 잔고가 바뀌면 함께 무효화할 쿼리의 공통 prefix */
const BALANCE_KEY = ['balance'] as const;

export const queryKeys = {
  integratedBalance: [...BALANCE_KEY, 'integrated'] as const,
  purchases: (securityId: string) =>
    [...BALANCE_KEY, 'purchases', securityId] as const,
  dividends: (from?: string, to?: string) =>
    [...BALANCE_KEY, 'dividends', from ?? null, to ?? null] as const,
  returns: (from: string, to: string) =>
    [...BALANCE_KEY, 'returns', from, to] as const,
  securitySearch: (keyword: string) => ['securities', keyword] as const,
  dailyPrices: (securityId: string, from?: string, to?: string) =>
    ['daily-prices', securityId, from ?? null, to ?? null] as const,
};

export const useIntegratedBalance = () =>
  useQuery({
    queryKey: queryKeys.integratedBalance,
    queryFn: ({ signal }) =>
      request<IntegratedBalanceResponse>('/balance', { signal }),
  });

export const usePurchases = (securityId: string) =>
  useQuery({
    queryKey: queryKeys.purchases(securityId),
    queryFn: ({ signal }) =>
      request<PurchaseHistoryResponse>('/balance/purchases', {
        query: { securityId },
        signal,
      }),
    enabled: !!securityId,
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
