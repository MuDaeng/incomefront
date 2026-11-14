import {
  formatKrw,
  formatKrwCompact,
  formatRate,
  formatUsd,
  isPositiveDecimal,
  profitColor,
  RISE_COLOR,
  FALL_COLOR,
  toPriceInput,
} from '../../src/lib/format';

describe('format', () => {
  it('원화는 정수, 천 단위 구분', () => {
    expect(formatKrw('1234567')).toBe('1,234,567원');
    expect(formatKrw(null)).toBe('-');
  });

  it('달러는 소수 2자리', () => {
    expect(formatUsd('1234.5')).toBe('$1,234.50');
    expect(formatUsd('-3.456789', 4)).toBe('-$3.4568');
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

  it('입력란 단가: 원화는 정수, 달러는 소수 2자리', () => {
    expect(toPriceInput('123.456789', 'USD')).toBe('123.46');
    expect(toPriceInput('50.000000', 'USD')).toBe('50.00');
    expect(toPriceInput('71000', 'KRW')).toBe('71000');
    expect(toPriceInput(null, 'USD')).toBe('');
  });
});
