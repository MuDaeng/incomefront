import { clientTypeLabel, formatElapsed } from '../../src/lib/clientTokens';

describe('clientTypeLabel', () => {
  it('알려진 외부 API는 한국어 이름', () => {
    expect(clientTypeLabel('KIS')).toBe('한국투자증권(KIS)');
    expect(clientTypeLabel('TOSS')).toBe('토스');
    expect(clientTypeLabel('KAKAO')).toBe('카카오');
    expect(clientTypeLabel('NAVER')).toBe('네이버');
  });

  it('모르는 값은 그대로', () => {
    expect(clientTypeLabel('GOOGLE')).toBe('GOOGLE');
  });
});

describe('formatElapsed', () => {
  const now = new Date('2026-11-26T12:00:00.000Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const MIN = 60_000;

  it('1분 미만은 방금 전', () => {
    expect(formatElapsed(ago(0), now)).toBe('방금 전');
    expect(formatElapsed(ago(59_999), now)).toBe('방금 전');
  });

  it('1시간 미만은 분', () => {
    expect(formatElapsed(ago(MIN), now)).toBe('1분 전');
    expect(formatElapsed(ago(59 * MIN), now)).toBe('59분 전');
  });

  it('하루 미만은 시간·분', () => {
    expect(formatElapsed(ago(60 * MIN), now)).toBe('1시간 전');
    expect(formatElapsed(ago(150 * MIN), now)).toBe('2시간 30분 전');
    expect(formatElapsed(ago(24 * 60 * MIN - 1), now)).toBe('23시간 59분 전');
  });

  it('하루 이상은 일', () => {
    expect(formatElapsed(ago(25 * 60 * MIN), now)).toBe('1일 전');
    expect(formatElapsed(ago(3 * 24 * 60 * MIN), now)).toBe('3일 전');
  });

  it('미래 시각·잘못된 값·빈 값은 -', () => {
    expect(formatElapsed(ago(-MIN), now)).toBe('-');
    expect(formatElapsed('not-a-date', now)).toBe('-');
    expect(formatElapsed(null, now)).toBe('-');
  });
});
