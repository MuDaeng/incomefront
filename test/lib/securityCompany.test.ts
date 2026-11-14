import {
  filterCompanyOptions,
  loadLastSecurityCompany,
  parseSecurityCompany,
  saveLastSecurityCompany,
  SECURITY_COMPANIES,
  securityCompanyLabel,
  securityCompanyShortLabel,
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

  describe('filterCompanyOptions', () => {
    it('목록을 아직 못 받았으면 전체 증권사', () => {
      expect(filterCompanyOptions(undefined)).toHaveLength(SECURITY_COMPANIES.length);
    });

    it('받은 증권사만, 백엔드 enum 순서로', () => {
      expect(filterCompanyOptions(['TOSS', 'MIRAE_ASSET', 'KIWOOM'])).toEqual([
        'MIRAE_ASSET',
        'KIWOOM',
        'TOSS',
      ]);
    });

    it('선택된 증권사는 목록에 없어도 넣어 둔다', () => {
      expect(filterCompanyOptions(['TOSS'], 'SAMSUNG')).toEqual(['SAMSUNG', 'TOSS']);
      expect(filterCompanyOptions([], 'KB')).toEqual(['KB']);
      expect(filterCompanyOptions([])).toEqual([]);
    });
  });
});
