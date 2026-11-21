import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseAccountId } from './account';

const PARAM = 'accountId';

/**
 * 계좌 필터를 URL 쿼리(?accountId=)에 둔다. 새로고침·뒤로 가기에도 유지된다.
 * 다른 쿼리 키는 그대로 두고, 히스토리를 쌓지 않도록 replace로 바꾼다.
 */
export function useAccountParam(): [number | undefined, (value: number | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountId = parseAccountId(searchParams.get(PARAM));

  const setAccountId = useCallback(
    (value: number | null) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(PARAM, String(value));
          else next.delete(PARAM);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  return [accountId, setAccountId];
}
