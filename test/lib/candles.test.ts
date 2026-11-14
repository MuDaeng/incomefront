import { priceDomain, toCandles, toWeeklyCandles, weekStart, type Candle } from '../../src/lib/candles';

const c = (date: string, open: number, high: number, low: number, close: number): Candle => ({
  date,
  open,
  high,
  low,
  close,
});

describe('candles', () => {
  it('주 시작은 월요일', () => {
    expect(weekStart('2026-11-09')).toBe('2026-11-09'); // 월
    expect(weekStart('2026-11-13')).toBe('2026-11-09'); // 금
    expect(weekStart('2026-11-15')).toBe('2026-11-09'); // 일
    expect(weekStart('2026-11-16')).toBe('2026-11-16'); // 다음 주 월
  });

  it('일봉을 주봉으로 묶는다 (시가=첫날, 종가=마지막날, 고저=주중 극값)', () => {
    const weekly = toWeeklyCandles([
      c('2026-11-03', 100, 110, 95, 105),
      c('2026-11-04', 105, 120, 100, 115),
      c('2026-11-06', 115, 118, 90, 92),
      c('2026-11-09', 93, 99, 91, 98),
    ]);
    expect(weekly).toEqual([c('2026-11-03', 100, 120, 90, 92), c('2026-11-09', 93, 99, 91, 98)]);
  });

  it('원본 일봉을 변경하지 않는다', () => {
    const daily = [c('2026-11-09', 1, 2, 1, 2), c('2026-11-10', 2, 5, 0.5, 4)];
    toWeeklyCandles(daily);
    expect(daily[0]).toEqual(c('2026-11-09', 1, 2, 1, 2));
  });

  it('decimal string 시세를 날짜순 봉으로 변환', () => {
    const p = (date: string, o: string, h: string, l: string, cl: string) => ({
      date,
      openingPrice: o,
      highestPrice: h,
      lowestPrice: l,
      closingPrice: cl,
    });
    const prices = [p('2026-11-10', '2', '3', '1', '2.5'), p('2026-11-09', '1', '2', '0.5', '1.5')];
    expect(toCandles(prices, 'day').map((x) => x.date)).toEqual(['2026-11-09', '2026-11-10']);
    expect(toCandles(prices, 'week')).toEqual([c('2026-11-09', 1, 3, 0.5, 2.5)]);
  });

  it('y축 범위는 저가~고가와 기준선을 포함하고 여백을 둔다', () => {
    const d = priceDomain([c('2026-11-09', 100, 200, 100, 150)], 250)!;
    expect(d.min).toBeLessThan(100);
    expect(d.max).toBeGreaterThan(250);
    expect(priceDomain([])).toBeNull();
  });
});
