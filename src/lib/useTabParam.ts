import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const PARAM = 'tab';

/**
 * 페이지 탭을 URL 쿼리(?tab=)에 둔다. 새로고침·뒤로 가기에도 유지된다.
 * 목록에 없는 값이면 첫 번째 탭. 다른 쿼리 키는 그대로 두고 replace로 바꾼다.
 */
export function useTabParam<T extends string>(tabs: readonly T[]): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(PARAM);
  const tab = tabs.find((t) => t === raw) ?? tabs[0];

  const setTab = useCallback(
    (value: T) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === tabs[0]) next.delete(PARAM);
          else next.set(PARAM, value);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams, tabs],
  );

  return [tab, setTab];
}
