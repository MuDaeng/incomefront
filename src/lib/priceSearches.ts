import type { PriceSearchItem } from '../api/types';

/**
 * 시세 조회 이력을 종목명·심볼로 거른다 (대소문자 무시, 앞뒤 공백 무시).
 * 검색어가 비어 있으면 전체를 그대로 돌려준다. securityId는 화면에 보이지 않으므로 검색 대상이 아니다
 */
export const filterPriceSearches = (items: PriceSearchItem[], keyword: string): PriceSearchItem[] => {
  const q = keyword.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      (item.name ?? '').toLowerCase().includes(q) || (item.symbol ?? '').toLowerCase().includes(q),
  );
};
