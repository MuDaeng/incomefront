/**
 * access token(JWT) payload의 rules(사용자 권한, 예: ['user', 'admin'])를 꺼낸다.
 * 서명 검증은 서버가 하므로 여기서는 메뉴 노출 같은 화면 판단에만 쓴다.
 * 형식이 틀리거나 rules가 없으면(권한 도입 전에 발급된 토큰) 빈 배열.
 */
export function decodeAccessTokenRules(token: string | null | undefined): string[] {
  const payload = token?.split('.')[1];
  if (!payload) return [];
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const { rules } = JSON.parse(atob(padded)) as { rules?: unknown };
    return Array.isArray(rules) ? rules.filter((r): r is string => typeof r === 'string') : [];
  } catch {
    return [];
  }
}

/** 관리자 권한 여부 */
export const isAdminToken = (token: string | null | undefined): boolean =>
  decodeAccessTokenRules(token).includes('admin');
