/**
 * 매수한 증권사. 백엔드 enum(libs/common/src/balance/security-company.enum.ts)과 순서·값을 맞춘다.
 */
export const SECURITY_COMPANIES = [
  { value: 'MIRAE_ASSET', label: '미래에셋증권' },
  { value: 'KOREA_INVESTMENT', label: '한국투자증권' },
  { value: 'NH_INVESTMENT', label: 'NH투자증권' },
  { value: 'SAMSUNG', label: '삼성증권' },
  { value: 'KB', label: 'KB증권' },
  { value: 'KIWOOM', label: '키움증권' },
  { value: 'SHINHAN', label: '신한투자증권' },
  { value: 'HANA', label: '하나증권' },
  { value: 'MERITZ', label: '메리츠증권' },
  { value: 'DAISHIN', label: '대신증권' },
  { value: 'TOSS', label: '토스증권' },
  { value: 'KAKAO_PAY', label: '카카오페이증권' },
  { value: 'WOORI', label: '우리투자증권' },
  { value: 'YUANTA', label: '유안타증권' },
  { value: 'HANWHA', label: '한화투자증권' },
  { value: 'KYOBO', label: '교보증권' },
  { value: 'HYUNDAI_MOTOR', label: '현대차증권' },
  { value: 'IM', label: 'iM증권' },
  { value: 'DB', label: 'DB증권' },
  { value: 'IBK', label: 'IBK투자증권' },
  { value: 'SK', label: 'SK증권' },
  { value: 'EUGENE', label: '유진투자증권' },
  { value: 'LS', label: 'LS증권' },
  { value: 'SHINYOUNG', label: '신영증권' },
  { value: 'HANYANG', label: '한양증권' },
  { value: 'BOOKOOK', label: '부국증권' },
  { value: 'DAOL', label: '다올투자증권' },
  { value: 'SANGSANGIN', label: '상상인증권' },
  { value: 'BNK', label: 'BNK투자증권' },
  { value: 'CAPE', label: '케이프투자증권' },
  { value: 'HEUNGKUK', label: '흥국증권' },
  { value: 'LEADING', label: '리딩투자증권' },
  { value: 'ETC', label: '기타' },
] as const;

export type SecurityCompany = (typeof SECURITY_COMPANIES)[number]['value'];

const LABELS = new Map<string, string>(SECURITY_COMPANIES.map((c) => [c.value, c.label]));

/** 증권사 코드 → 한국어 이름 (모르는 값은 그대로) */
export const securityCompanyLabel = (value: string): string => LABELS.get(value) ?? value;

/** URL 쿼리 등 외부 값이 목록에 있는 증권사일 때만 그 값을, 아니면 undefined */
export const parseSecurityCompany = (value: string | null | undefined): SecurityCompany | undefined =>
  value && LABELS.has(value) ? (value as SecurityCompany) : undefined;

/** 마지막으로 등록한 증권사 (브라우저별 편의 기능, 저장소를 못 쓰면 무시) */
const LAST_KEY = 'income.lastSecurityCompany';

export function loadLastSecurityCompany(): SecurityCompany | null {
  try {
    return parseSecurityCompany(localStorage.getItem(LAST_KEY)) ?? null;
  } catch {
    return null;
  }
}

export function saveLastSecurityCompany(value: SecurityCompany): void {
  try {
    localStorage.setItem(LAST_KEY, value);
  } catch {
    /* 저장소 사용 불가 환경은 무시 */
  }
}

/** 종목 상세 경로. 증권사 필터가 있으면 쿼리로 넘겨 상세에서도 같은 증권사 매수분을 보게 한다 */
export const securityDetailPath = (securityId: string, securityCompany?: SecurityCompany): string =>
  `/securities/${encodeURIComponent(securityId)}${securityCompany ? `?securityCompany=${securityCompany}` : ''}`;
