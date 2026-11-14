import { MAX_MONTHS, monthsForDateRange, totalReturnRate } from '../../src/lib/months';

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
