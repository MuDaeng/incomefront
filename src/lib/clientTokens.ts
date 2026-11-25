import type { ClientType } from '../api/types';

/** 외부 API 이름. 키는 백엔드 libs/common/src/client/client-type.enum.ts와 맞춘다 */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  KIS: '한국투자증권(KIS)',
  TOSS: '토스',
  KAKAO: '카카오',
  NAVER: '네이버',
};

/** 모르는 값(백엔드에 새로 생긴 종류)은 원래 문자열을 그대로 보여 준다 */
export const clientTypeLabel = (clientType: string): string =>
  CLIENT_TYPE_LABELS[clientType as ClientType] ?? clientType;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * ISO 시각부터 now까지 지난 시간: '방금 전' / 'n분 전' / 'n시간 m분 전' / 'n일 전'.
 * 잘못된 값이나 미래 시각은 '-'
 */
export const formatElapsed = (iso: string | null | undefined, now: Date = new Date()): string => {
  if (!iso) return '-';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '-';
  const diff = now.getTime() - time;
  if (diff < 0) return '-';
  if (diff < MINUTE) return '방금 전';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`;
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    const minutes = Math.floor((diff % HOUR) / MINUTE);
    return minutes ? `${hours}시간 ${minutes}분 전` : `${hours}시간 전`;
  }
  return `${Math.floor(diff / DAY)}일 전`;
};
