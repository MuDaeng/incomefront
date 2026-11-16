import { decodeAccessTokenRules, isAdminToken } from '../../src/lib/jwt';

/** 서명 없이 payload만 맞춘 테스트용 JWT (base64url, padding 제거) */
const tokenWith = (payload: object) => {
  const encode = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
};

describe('decodeAccessTokenRules', () => {
  it('reads rules from the payload', () => {
    expect(decodeAccessTokenRules(tokenWith({ sub: 1, rules: ['user', 'admin'] }))).toEqual([
      'user',
      'admin',
    ]);
  });

  it('returns an empty list for tokens without rules or malformed tokens', () => {
    expect(decodeAccessTokenRules(tokenWith({ sub: 1 }))).toEqual([]);
    expect(decodeAccessTokenRules(tokenWith({ sub: 1, rules: 'admin' }))).toEqual([]);
    expect(decodeAccessTokenRules('not-a-jwt')).toEqual([]);
    expect(decodeAccessTokenRules('a.%%%.c')).toEqual([]);
    expect(decodeAccessTokenRules(null)).toEqual([]);
  });

  it('decodes base64url payloads that need padding', () => {
    // '?' 같은 문자로 base64url의 '-'/'_' 치환과 padding 복원이 모두 쓰이게 한다
    expect(decodeAccessTokenRules(tokenWith({ sub: 12, x: '??>', rules: ['admin'] }))).toEqual([
      'admin',
    ]);
  });
});

describe('isAdminToken', () => {
  it('is true only when rules include admin', () => {
    expect(isAdminToken(tokenWith({ sub: 1, rules: ['user', 'admin'] }))).toBe(true);
    expect(isAdminToken(tokenWith({ sub: 1, rules: ['user'] }))).toBe(false);
    expect(isAdminToken(null)).toBe(false);
  });
});
