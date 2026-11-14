import { apiErrorMessage } from '../lib/apiError';

export const API_URL = (
  process.env.REACT_APP_API_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

/** Google 로그인 시작 주소 (백엔드가 Google 로그인 페이지로 리다이렉트) */
export const GOOGLE_LOGIN_URL = `${API_URL}/auth/google`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/* ---------- access token (메모리 보관, refresh token은 httpOnly cookie) ---------- */
let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/** refresh token까지 만료되어 재로그인이 필요할 때 호출 */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

/** 에러 응답을 ApiError로 (메시지 규칙은 src/lib/apiError.ts) */
const toApiError = async (res: Response): Promise<ApiError> => {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  return new ApiError(res.status, apiErrorMessage(res.status, body), body);
};

/**
 * refresh token cookie로 access token 발급. 동시에 여러 번 호출돼도 요청은 하나만 보냄
 * (reissue는 refresh token을 교체하므로 중복 호출 시 두 번째가 401이 됨)
 */
let pendingToken: Promise<string> | null = null;
const requestToken = (path: '/auth/access' | '/auth/reissue') => {
  if (!pendingToken) {
    pendingToken = (async () => {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw await toApiError(res);
      const { accessToken: token } = (await res.json()) as {
        accessToken: string;
      };
      setAccessToken(token);
      return token;
    })().finally(() => {
      pendingToken = null;
    });
  }
  return pendingToken;
};

/** 로그인 직후 / 앱 진입 시: refresh token 유지한 채 access token 발급 */
export const issueAccessToken = () => requestToken('/auth/access');
/** access token 만료 시: 두 토큰 재발급 (refresh token rotation) */
export const reissueAccessToken = () => requestToken('/auth/reissue');

type Query = Record<string, string | number | null | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

const buildUrl = (path: string, query?: Query) => {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

export async function request<T>(
  path: string,
  { method = 'GET', query, body, signal }: RequestOptions = {},
): Promise<T> {
  const send = () =>
    fetch(buildUrl(path, query), {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await send();
  if (res.status === 401) {
    try {
      await reissueAccessToken();
    } catch (error) {
      // 속도 제한(429)은 토큰 문제가 아니므로 로그아웃하지 않고 그대로 알린다
      if (error instanceof ApiError && error.status === 429) throw error;
      setAccessToken(null);
      unauthorizedHandler?.();
      throw new ApiError(401, '로그인이 만료되었습니다. 다시 로그인해 주세요.');
    }
    res = await send();
  }
  if (!res.ok) throw await toApiError(res);

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
