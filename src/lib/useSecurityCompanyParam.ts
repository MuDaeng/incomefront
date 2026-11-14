import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseSecurityCompany, type SecurityCompany } from './securityCompany';

const PARAM = 'securityCompany';

/**
 * 증권사 필터를 URL 쿼리(?securityCompany=)에 둔다. 새로고침·뒤로 가기에도 유지된다.
 * 다른 쿼리 키는 그대로 두고, 히스토리를 쌓지 않도록 replace로 바꾼다.
 */
export function useSecurityCompanyParam(): [
  SecurityCompany | undefined,
  (value: SecurityCompany | null) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams();
  const securityCompany = parseSecurityCompany(searchParams.get(PARAM));

  const setSecurityCompany = useCallback(
    (value: SecurityCompany | null) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(PARAM, value);
          else next.delete(PARAM);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  return [securityCompany, setSecurityCompany];
}
