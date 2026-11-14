/** 백엔드 요청 속도 제한(@nestjs/throttler, IP당 1분 창)에 걸렸을 때 보여 줄 문구 */
export const RATE_LIMIT_MESSAGE = '요청이 너무 많습니다. 1분 정도 후에 다시 시도해 주세요.';

/**
 * 에러 응답에서 사용자에게 보여 줄 메시지를 만든다.
 * - 429는 본문과 상관없이 한국어 안내 (Nest 본문은 "ThrottlerException: Too Many Requests")
 * - Nest 에러 본문의 message: string | string[] | Zod issue[] ({ message }) 를 처리
 * - 그 밖에는 상태코드를 넣은 기본 문구
 */
export function apiErrorMessage(status: number, body: unknown): string {
  if (status === 429) return RATE_LIMIT_MESSAGE;
  const fallback = `요청에 실패했습니다. (${status})`;
  if (!body || typeof body !== 'object' || !('message' in body)) return fallback;

  const raw = (body as { message: unknown }).message;
  if (typeof raw === 'string') return raw || fallback;
  if (Array.isArray(raw)) {
    const parts = raw
      .map((m) =>
        typeof m === 'string'
          ? m
          : m && typeof m === 'object' && 'message' in m
            ? String((m as { message: unknown }).message)
            : '',
      )
      .filter(Boolean);
    if (parts.length) return parts.join('\n');
  }
  return fallback;
}
