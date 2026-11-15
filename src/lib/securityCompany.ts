/**
 * 매수한 증권사. label은 정식 이름(입력·필터), short는 표에 쓰는 짧은 이름. 백엔드 enum(libs/common/src/balance/security-company.enum.ts)과 순서·값을 맞춘다.
 */
export const SECURITY_COMPANIES = [
  { value: 'MIRAE_ASSET', label: '미래에셋증권', short: '미래에셋' },
  { value: 'KOREA_INVESTMENT', label: '한국투자증권', short: '한국투자' },
  { value: 'NH_INVESTMENT', label: 'NH투자증권', short: 'NH' },
  { value: 'SAMSUNG', label: '삼성증권', short: '삼성' },
  { value: 'KB', label: 'KB증권', short: 'KB' },
  { value: 'KIWOOM', label: '키움증권', short: '키움' },
  { value: 'SHINHAN', label: '신한투자증권', short: '신한' },
  { value: 'HANA', label: '하나증권', short: '하나' },
  { value: 'MERITZ', label: '메리츠증권', short: '메리츠' },
  { value: 'DAISHIN', label: '대신증권', short: '대신' },
  { value: 'TOSS', label: '토스증권', short: '토스' },
  { value: 'KAKAO_PAY', label: '카카오페이증권', short: '카카오페이' },
  { value: 'WOORI', label: '우리투자증권', short: '우리' },
  { value: 'YUANTA', label: '유안타증권', short: '유안타' },
  { value: 'HANWHA', label: '한화투자증권', short: '한화' },
  { value: 'KYOBO', label: '교보증권', short: '교보' },
  { value: 'HYUNDAI_MOTOR', label: '현대차증권', short: '현대차' },
  { value: 'IM', label: 'iM증권', short: 'iM' },
  { value: 'DB', label: 'DB증권', short: 'DB' },
  { value: 'IBK', label: 'IBK투자증권', short: 'IBK' },
  { value: 'SK', label: 'SK증권', short: 'SK' },
  { value: 'EUGENE', label: '유진투자증권', short: '유진' },
  { value: 'LS', label: 'LS증권', short: 'LS' },
  { value: 'SHINYOUNG', label: '신영증권', short: '신영' },
  { value: 'HANYANG', label: '한양증권', short: '한양' },
  { value: 'BOOKOOK', label: '부국증권', short: '부국' },
  { value: 'DAOL', label: '다올투자증권', short: '다올' },
  { value: 'SANGSANGIN', label: '상상인증권', short: '상상인' },
  { value: 'BNK', label: 'BNK투자증권', short: 'BNK' },
  { value: 'CAPE', label: '케이프투자증권', short: '케이프' },
  { value: 'HEUNGKUK', label: '흥국증권', short: '흥국' },
  { value: 'LEADING', label: '리딩투자증권', short: '리딩' },
  { value: 'ETC', label: '기타', short: '기타' },
] as const;

export type SecurityCompany = (typeof SECURITY_COMPANIES)[number]['value'];

const LABELS = new Map<string, string>(SECURITY_COMPANIES.map((c) => [c.value, c.label]));

const SHORT_LABELS = new Map<string, string>(SECURITY_COMPANIES.map((c) => [c.value, c.short]));

/** 표처럼 좁은 곳에 쓰는 짧은 이름 ('증권'·'투자증권'을 뗀 이름, 예: 토스, NH). 모르는 값은 그대로 */
export const securityCompanyShortLabel = (value: string): string => SHORT_LABELS.get(value) ?? value;

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

/**
 * 필터 콤보박스에 보여 줄 증권사.
 * - available이 없으면(로딩 중·실패) 전체 목록 (필터를 못 쓰게 되지 않도록)
 * - 있으면 그 증권사만, 전체 목록 순서(= 백엔드 enum 순서)대로
 * - 이미 선택된 값(URL)은 목록에 없어도 넣어 둔다 (선택이 화면에서 사라지지 않도록)
 */
export function filterCompanyOptions(
  available: readonly SecurityCompany[] | undefined,
  selected?: SecurityCompany,
): SecurityCompany[] {
  const all = SECURITY_COMPANIES.map((c) => c.value);
  if (!available) return all;
  const keep = new Set<SecurityCompany>(available);
  if (selected) keep.add(selected);
  return all.filter((value) => keep.has(value));
}

/**
 * 증권사별 보유 수량을 한 줄로 (예: "토스 3 · NH 2").
 * 증권사가 1곳 이하이면 총 수량과 같아 보여 줄 필요가 없으므로 null.
 */
export function formatCompanyAmounts(
  companyAmounts: readonly { securityCompany: string; amount: string }[] | undefined,
  formatAmount: (amount: string) => string,
): string | null {
  if (!companyAmounts || companyAmounts.length < 2) return null;
  return companyAmounts
    .map((c) => `${securityCompanyShortLabel(c.securityCompany)} ${formatAmount(c.amount)}`)
    .join(' · ');
}
