import {
  formatDateTime,
  formatDuration,
  formatKrw,
  formatKrwCompact,
  formatRate,
  formatUsd,
  isPositiveDecimal,
  profitColor,
  RISE_COLOR,
  FALL_COLOR,
  toPriceInput,
  truncateDecimals,
} from '../../src/lib/format';

describe('format', () => {
  it('원화는 정수, 천 단위 구분', () => {
    expect(formatKrw('1234567')).toBe('1,234,567원');
    expect(formatKrw(null)).toBe('-');
  });

  it('달러는 소수 2자리', () => {
    expect(formatUsd('1234.5')).toBe('$1,234.50');
    expect(formatUsd('-3.456789', 4)).toBe('-$3.4567');
  });

  it('수익률은 부호와 함께', () => {
    expect(formatRate('12.34')).toBe('+12.34%');
    expect(formatRate('-1.5')).toBe('-1.50%');
    expect(formatRate('0.00')).toBe('0.00%');
  });

  it('큰 금액 축약', () => {
    expect(formatKrwCompact(123_000_000)).toBe('1.2억');
    expect(formatKrwCompact(34_000)).toBe('3만');
  });

  it('양의 십진수 문자열 검증 (백엔드 규칙과 동일)', () => {
    expect(isPositiveDecimal('10')).toBe(true);
    expect(isPositiveDecimal('0.123456')).toBe(true);
    expect(isPositiveDecimal('0')).toBe(false);
    expect(isPositiveDecimal('-1')).toBe(false);
    expect(isPositiveDecimal('1e3')).toBe(false);
  });

  it('상승 빨강 / 하락 파랑', () => {
    expect(profitColor('1')).toBe(RISE_COLOR);
    expect(profitColor('-1')).toBe(FALL_COLOR);
    expect(profitColor('0')).toBeUndefined();
  });

  it('입력란 단가: 원화는 정수, 달러는 소수 2자리 (버림)', () => {
    expect(toPriceInput('123.456789', 'USD')).toBe('123.45');
    expect(toPriceInput('71000.9', 'KRW')).toBe('71000');
    expect(toPriceInput('50.000000', 'USD')).toBe('50.00');
    expect(toPriceInput('71000', 'KRW')).toBe('71000');
    expect(toPriceInput(null, 'USD')).toBe('');
  });

  it('금액은 반올림하지 않고 버린다', () => {
    expect(formatUsd('123.456789')).toBe('$123.45');
    expect(formatUsd('1.999')).toBe('$1.99');
    expect(formatUsd('-1.999')).toBe('-$1.99');
    expect(formatUsd('-0.001')).toBe('$0.00');
    expect(formatUsd(0.29 * 100)).toBe('$29.00');
    expect(formatKrw(71000.9)).toBe('71,000원');
    expect(formatKrw(0.29 * 100 * 1000)).toBe('29,000원');
  });

  it('버림은 부동소수점 오차로 한 단위 덜 잘리지 않는다', () => {
    expect(truncateDecimals(0.29 * 100, 0)).toBe(29);
    expect(truncateDecimals(3 * 1.1, 2)).toBe(3.3);
    expect(truncateDecimals(-1.239, 2)).toBe(-1.23);
  });
});

describe('formatDuration', () => {
  it('formats milliseconds by size', () => {
    expect(formatDuration(850)).toBe('850ms');
    expect(formatDuration(12345)).toBe('12.3초');
    expect(formatDuration(83000)).toBe('1분 23초');
    expect(formatDuration(3720000)).toBe('1시간 2분');
  });

  it('shows a dash for missing values', () => {
    expect(formatDuration(null)).toBe(formatDuration(undefined));
    expect(formatDuration(null)).not.toMatch(/d/);
  });
});

describe('formatDateTime', () => {
  it('formats an ISO time in local time', () => {
    const d = new Date(2026, 2, 5, 16, 0, 12);
    expect(formatDateTime(d.toISOString())).toBe('2026.03.05 16:00:12');
  });

  it('shows a dash for missing or invalid values', () => {
    expect(formatDateTime(null)).toBe(formatDateTime('not-a-date'));
  });
});
