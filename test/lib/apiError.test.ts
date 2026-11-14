import { apiErrorMessage, RATE_LIMIT_MESSAGE } from '../../src/lib/apiError';

describe('apiErrorMessage', () => {
  it('429는 본문과 상관없이 한국어 안내', () => {
    expect(
      apiErrorMessage(429, { statusCode: 429, message: 'ThrottlerException: Too Many Requests' }),
    ).toBe(RATE_LIMIT_MESSAGE);
    expect(apiErrorMessage(429, undefined)).toBe(RATE_LIMIT_MESSAGE);
  });

  it('message가 문자열이면 그대로', () => {
    expect(apiErrorMessage(404, { message: '매수 내역이 없습니다.' })).toBe('매수 내역이 없습니다.');
  });

  it('message가 문자열 배열이면 줄바꿈으로 합친다', () => {
    expect(apiErrorMessage(400, { message: ['a', 'b'] })).toBe('a\nb');
  });

  it('message가 Zod issue 배열이면 각 message를 합친다', () => {
    expect(
      apiErrorMessage(400, { message: [{ path: ['price'], message: '0보다 커야 합니다.' }, {}] }),
    ).toBe('0보다 커야 합니다.');
  });

  it('본문이 없거나 message가 없으면 기본 문구', () => {
    expect(apiErrorMessage(500, undefined)).toBe('요청에 실패했습니다. (500)');
    expect(apiErrorMessage(502, { error: 'x' })).toBe('요청에 실패했습니다. (502)');
    expect(apiErrorMessage(400, { message: [] })).toBe('요청에 실패했습니다. (400)');
  });
});
