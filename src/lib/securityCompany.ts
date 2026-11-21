/**
 * 매수한 증권사. label은 정식 이름(입력·필터), short는 표에 쓰는 짧은 이름, color는 표에서 증권사를 구분하는 색(주요 증권사는 브랜드 색에 가깝게). 백엔드 enum(libs/common/src/user/security-company.enum.ts)과 순서·값을 맞춘다.
 */
export const SECURITY_COMPANIES = [
  { value: 'MIRAE_ASSET', label: '미래에셋증권', short: '미래에셋', color: '#F9721B' },
  { value: 'KOREA_INVESTMENT', label: '한국투자증권', short: '한국투자', color: '#905A26' },
  { value: 'NH_INVESTMENT', label: 'NH투자증권', short: 'NH', color: '#29A34D' },
  { value: 'SAMSUNG', label: '삼성증권', short: '삼성', color: '#0F25A4' },
  { value: 'KB', label: 'KB증권', short: 'KB', color: '#937B62' },
  { value: 'KIWOOM', label: '키움증권', short: '키움', color: '#C2006E' },
  { value: 'SHINHAN', label: '신한투자증권', short: '신한', color: '#5667C6' },
  { value: 'HANA', label: '하나증권', short: '하나', color: '#00857A' },
  { value: 'MERITZ', label: '메리츠증권', short: '메리츠', color: '#DD0E19' },
  { value: 'DAISHIN', label: '대신증권', short: '대신', color: '#911FAF' },
  { value: 'TOSS', label: '토스증권', short: '토스', color: '#0064FF' },
  { value: 'KAKAO_PAY', label: '카카오페이증권', short: '카카오페이', color: '#F2C200' },
  { value: 'WOORI', label: '우리투자증권', short: '우리', color: '#00A3E0' },
  { value: 'YUANTA', label: '유안타증권', short: '유안타', color: '#E96F6F' },
  { value: 'HANWHA', label: '한화투자증권', short: '한화', color: '#FF8F00' },
  { value: 'KYOBO', label: '교보증권', short: '교보', color: '#54902A' },
  { value: 'HYUNDAI_MOTOR', label: '현대차증권', short: '현대차', color: '#415B68' },
  { value: 'IM', label: 'iM증권', short: 'iM', color: '#21AB9E' },
  { value: 'DB', label: 'DB증권', short: 'DB', color: '#00695C' },
  { value: 'IBK', label: 'IBK투자증권', short: 'IBK', color: '#1065C5' },
  { value: 'SK', label: 'SK증권', short: 'SK', color: '#F44E4B' },
  { value: 'EUGENE', label: '유진투자증권', short: '유진', color: '#AF41C2' },
  { value: 'LS', label: 'LS증권', short: 'LS', color: '#714A3D' },
  { value: 'SHINYOUNG', label: '신영증권', short: '신영', color: '#7483D0' },
  { value: 'HANYANG', label: '한양증권', short: '한양', color: '#47BCB1' },
  { value: 'BOOKOOK', label: '부국증권', short: '부국', color: '#A78579' },
  { value: 'DAOL', label: '다올투자증권', short: '다올', color: '#9CD160' },
  { value: 'SANGSANGIN', label: '상상인증권', short: '상상인', color: '#BE63CD' },
  { value: 'BNK', label: 'BNK투자증권', short: 'BNK', color: '#EB342F' },
  { value: 'CAPE', label: '케이프투자증권', short: '케이프', color: '#7292A2' },
  { value: 'HEUNGKUK', label: '흥국증권', short: '흥국', color: '#FFB74D' },
  { value: 'LEADING', label: '리딩투자증권', short: '리딩', color: '#4AC5FC' },
  { value: 'ETC', label: '기타', short: '기타', color: '#9E9E9E' },
] as const;

export type SecurityCompany = (typeof SECURITY_COMPANIES)[number]['value'];

const LABELS = new Map<string, string>(SECURITY_COMPANIES.map((c) => [c.value, c.label]));

const SHORT_LABELS = new Map<string, string>(SECURITY_COMPANIES.map((c) => [c.value, c.short]));

const COLORS = new Map<string, string>(SECURITY_COMPANIES.map((c) => [c.value, c.color]));

/** 증권사 구분 색. 모르는 값은 기타(회색) */
export const securityCompanyColor = (value: string): string =>
  COLORS.get(value) ?? '#9E9E9E';

/** 표처럼 좁은 곳에 쓰는 짧은 이름 ('증권'·'투자증권'을 뗀 이름, 예: 토스, NH). 모르는 값은 그대로 */
export const securityCompanyShortLabel = (value: string): string => SHORT_LABELS.get(value) ?? value;

/** 증권사 코드 → 한국어 이름 (모르는 값은 그대로) */
export const securityCompanyLabel = (value: string): string => LABELS.get(value) ?? value;

/** URL 쿼리 등 외부 값이 목록에 있는 증권사일 때만 그 값을, 아니면 undefined */
export const parseSecurityCompany = (value: string | null | undefined): SecurityCompany | undefined =>
  value && LABELS.has(value) ? (value as SecurityCompany) : undefined;

