import {
  fillDividendMonths,
  monthTickLabel,
  trailingYearDividend,
} from '../../src/lib/dividends';

const m = (month: string, amount: string, count = 1) => ({ month, amount, count });

describe('fillDividendMonths', () => {
  it('returns an empty list for no dividends', () => {
    expect(fillDividendMonths([], 36)).toEqual([]);
  });

  it('fills missing months with zero up to the last month', () => {
    expect(fillDividendMonths([m('2025-11', '100'), m('2026-02', '120', 2)], 36)).toEqual([
      { month: '2025-11', amount: 100, count: 1 },
      { month: '2025-12', amount: 0, count: 0 },
      { month: '2026-01', amount: 0, count: 0 },
      { month: '2026-02', amount: 120, count: 2 },
    ]);
  });

  it('keeps only the most recent months', () => {
    const result = fillDividendMonths([m('2020-01', '1'), m('2026-03', '2')], 3);
    expect(result.map((r) => r.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(result[2].amount).toBe(2);
  });
});

describe('trailingYearDividend', () => {
  it('sums the 12 months ending with the current month and skips future months', () => {
    const months = [
      m('2025-11', '50'),
      m('2025-12', '100'),
      m('2026-06', '0.25', 2),
      m('2026-11', '100'),
      m('2026-12', '999'),
    ];
    expect(trailingYearDividend(months, '2026-11-16')).toEqual({ amount: 200.25, count: 4 });
  });
});

describe('monthTickLabel', () => {
  it('shows the year for January and the month otherwise', () => {
    expect(monthTickLabel('2026-01')).toBe('2026년');
    expect(monthTickLabel('2026-03')).toBe('3월');
  });
});
