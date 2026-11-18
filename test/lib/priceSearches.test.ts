import type { PriceSearchItem } from '../../src/api/types';
import { filterPriceSearches } from '../../src/lib/priceSearches';

const item = (securityId: string, name: string | null, symbol?: string | null): PriceSearchItem => ({
  securityId,
  name,
  symbol,
  lastSearchDate: '2026-11-18',
  createdAt: '2026-11-18T06:00:00.000Z',
  updatedAt: '2026-11-18T06:00:00.000Z',
});

const items = [
  item('KR7005930003', '삼성전자', '005930'),
  item('KR7000660001', 'SK하이닉스'),
  item('KR7069500007', null),
];

describe('filterPriceSearches', () => {
  it('검색어가 비어 있거나 공백뿐이면 전체를 돌려준다', () => {
    expect(filterPriceSearches(items, '')).toBe(items);
    expect(filterPriceSearches(items, '   ')).toBe(items);
  });

  it('종목명으로 거르고 대소문자를 무시한다', () => {
    expect(filterPriceSearches(items, '삼성').map((i) => i.securityId)).toEqual(['KR7005930003']);
    expect(filterPriceSearches(items, 'sk').map((i) => i.securityId)).toEqual(['KR7000660001']);
  });

  it('심볼로도 거른다', () => {
    expect(filterPriceSearches(items, ' 005930 ').map((i) => i.securityId)).toEqual(['KR7005930003']);
  });

  it('securityId로는 거르지 않는다 (화면에 보이지 않으므로)', () => {
    expect(filterPriceSearches(items, 'KR7069500007')).toEqual([]);
  });
});
