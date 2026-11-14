import { MONTH_PRESETS, monthRange, totalReturnRate } from '../../src/lib/months';

describe('monthRange', () => {
  it('이번 달까지 N개월, 연도 경계를 넘는다', () => {
    expect(monthRange(6, '2026-01-15')).toEqual({ from: '2025-08', to: '2026-01' });
    expect(monthRange(12, '2026-11-14')).toEqual({ from: '2025-12', to: '2026-11' });
  });

  it('1개월이면 from과 to가 같다 (0 이하도 1개월로)', () => {
    expect(monthRange(1, '2026-11-30')).toEqual({ from: '2026-11', to: '2026-11' });
    expect(monthRange(0, '2026-11-30')).toEqual({ from: '2026-11', to: '2026-11' });
  });

  it('월말(31일)에서도 개월 계산이 밀리지 않는다', () => {
    expect(monthRange(3, '2026-05-31')).toEqual({ from: '2026-03', to: '2026-05' });
  });

  it('프리셋은 짧은 기간부터, 백엔드 최대 120개월 이내', () => {
    const months = MONTH_PRESETS.map((p) => p.months);
    expect([...months].sort((a, b) => a - b)).toEqual(months);
    expect(Math.max(...months)).toBeLessThanOrEqual(120);
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
