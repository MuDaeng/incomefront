import {
  loadLastSecurityCompany,
  parseSecurityCompany,
  saveLastSecurityCompany,
  SECURITY_COMPANIES,
  securityCompanyLabel,
  securityDetailPath,
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

  it('목록에 있는 값만 파싱', () => {
    expect(parseSecurityCompany('TOSS')).toBe('TOSS');
    expect(parseSecurityCompany('toss')).toBeUndefined();
    expect(parseSecurityCompany('')).toBeUndefined();
    expect(parseSecurityCompany(null)).toBeUndefined();
  });

  it('마지막 증권사를 저장하고 읽는다 (잘못 저장된 값은 null)', () => {
    localStorage.clear();
    expect(loadLastSecurityCompany()).toBeNull();
    saveLastSecurityCompany('SAMSUNG');
    expect(loadLastSecurityCompany()).toBe('SAMSUNG');
    localStorage.setItem('income.lastSecurityCompany', 'NOPE');
    expect(loadLastSecurityCompany()).toBeNull();
  });

  it('종목 상세 경로에 증권사 필터를 쿼리로 붙인다', () => {
    expect(securityDetailPath('KR7005930003')).toBe('/securities/KR7005930003');
    expect(securityDetailPath('KR7005930003', 'KIWOOM')).toBe(
      '/securities/KR7005930003?securityCompany=KIWOOM',
    );
    expect(securityDetailPath('A B/C')).toBe('/securities/A%20B%2FC');
  });
});
