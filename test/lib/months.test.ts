import { MAX_MONTHS, monthsForDateRange, totalReturnRate, trimLeadingEmptyMonths } from '../../src/lib/months';

const TODAY = '2026-11-14';

describe('monthsForDateRange', () => {
  it('같은 달이면 1개월', () => {
    expect(monthsForDateRange('2026-11-14', '2026-11-14', TODAY)).toEqual({
      from: '2026-11',
      to: '2026-11',
      cappedToCurrentMonth: false,
      cappedToMaxMonths: false,
    });
  });

  it('날짜를 년월로 자르고 연도 경계를 넘는다', () => {
    expect(monthsForDateRange('2025-08-20', '2026-01-03', TODAY)).toMatchObject({
      from: '2025-08',
      to: '2026-01',
    });
  });

  it('종료일이 미래 달이면 이번 달로 줄인다', () => {
    expect(monthsForDateRange('2026-01-01', '2026-12-31', TODAY)).toEqual({
      from: '2026-01',
      to: '2026-11',
      cappedToCurrentMonth: true,
      cappedToMaxMonths: false,
    });
  });

  it(`${MAX_MONTHS}개월을 넘으면 최근 ${MAX_MONTHS}개월로 시작을 당긴다`, () => {
    expect(monthsForDateRange('2010-01-01', '2026-11-14', TODAY)).toEqual({
      from: '2016-12',
      to: '2026-11',
      cappedToCurrentMonth: false,
      cappedToMaxMonths: true,
    });
  });

  it('시작이 미래 달이면 조회할 달이 없어 null', () => {
    expect(monthsForDateRange('2026-12-01', '2026-12-31', TODAY)).toBeNull();
  });

  it(`시작일이 없으면(전체) 종료 달 기준 최근 ${MAX_MONTHS}개월`, () => {
    expect(monthsForDateRange(undefined, '2026-11-14', TODAY)).toEqual({
      from: '2016-12',
      to: '2026-11',
      cappedToCurrentMonth: false,
      cappedToMaxMonths: true,
    });
  });
});

describe('trimLeadingEmptyMonths', () => {
  const m = (month: string, n: number) => ({ month, items: Array<object>(n).fill({}) });

  it('앞쪽 빈 달만 자르고 중간·뒤쪽 빈 달은 남긴다', () => {
    const months = [m('2026-01', 0), m('2026-02', 0), m('2026-03', 1), m('2026-04', 0), m('2026-05', 2)];
    expect(trimLeadingEmptyMonths(months).map((x) => x.month)).toEqual(['2026-03', '2026-04', '2026-05']);
  });

  it('모두 비어 있으면 빈 배열', () => {
    expect(trimLeadingEmptyMonths([m('2026-01', 0)])).toEqual([]);
  });
});

describe('totalReturnRate', () => {
  it('원금 대비 총수익률(%)', () => {
    expect(totalReturnRate('1100000', '1000000')).toBeCloseTo(10);
    expect(totalReturnRate('900000', '1000000')).toBeCloseTo(-10);
  });

  it('원금이 0이거나 숫자가 아니면 null', () => {
    expect(totalReturnRate('5000', '0')).toBeNull();
    expect(totalReturnRate('abc', '1000')).toBeNull();
  });
});
