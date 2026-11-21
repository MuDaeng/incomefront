import {
  parseSecurityCompany,
  SECURITY_COMPANIES,
  securityCompanyColor,
  securityCompanyLabel,
  securityCompanyShortLabel,
} from '../../src/lib/securityCompany';

describe('securityCompany', () => {
  it('백엔드 enum과 같은 33개, 중복 없음, 기타(ETC)가 마지막', () => {
    const values = SECURITY_COMPANIES.map((c) => c.value);
    expect(values).toHaveLength(33);
    expect(new Set(values).size).toBe(values.length);
    expect(values[0]).toBe('MIRAE_ASSET');
    expect(values[values.length - 1]).toBe('ETC');
  });

  it('코드를 한국어 이름으로', () => {
    expect(securityCompanyLabel('KIWOOM')).toBe('키움증권');
    expect(securityCompanyLabel('ETC')).toBe('기타');
    expect(securityCompanyLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('표용 짧은 이름: 증권·투자증권을 떼고, 한국투자증권은 한국투자', () => {
    expect(securityCompanyShortLabel('TOSS')).toBe('토스');
    expect(securityCompanyShortLabel('NH_INVESTMENT')).toBe('NH');
    expect(securityCompanyShortLabel('KOREA_INVESTMENT')).toBe('한국투자');
    expect(securityCompanyShortLabel('KAKAO_PAY')).toBe('카카오페이');
    expect(securityCompanyShortLabel('ETC')).toBe('기타');
    // 짧은 이름이 비거나 '증권'으로 끝나는 항목이 없어야 한다
    for (const c of SECURITY_COMPANIES) {
      expect(c.short).toBeTruthy();
      expect(c.short.endsWith('증권')).toBe(false);
    }
  });

  it('목록에 있는 값만 파싱', () => {
    expect(parseSecurityCompany('TOSS')).toBe('TOSS');
    expect(parseSecurityCompany('toss')).toBeUndefined();
    expect(parseSecurityCompany('')).toBeUndefined();
    expect(parseSecurityCompany(null)).toBeUndefined();
  });
});

describe('securityCompanyColor', () => {
  it('gives every broker a distinct hex color and falls back to gray', () => {
    const colors = SECURITY_COMPANIES.map((c) => c.color);
    for (const c of colors) expect(c).toMatch(/^#[0-9A-F]{6}$/);
    expect(new Set(colors).size).toBe(colors.length);
    expect(securityCompanyColor('TOSS')).toBe('#0064FF');
    expect(securityCompanyColor('UNKNOWN')).toBe('#9E9E9E');
  });
});
