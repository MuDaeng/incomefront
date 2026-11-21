import {
  parseSecurityCompany,
  type SecurityCompany,
  securityCompanyLabel,
  securityCompanyShortLabel,
} from './securityCompany';

/** 계좌 타입. 백엔드 enum(libs/common/src/user/account-type.enum.ts)과 순서·값을 맞춘다 */
export const ACCOUNT_TYPES = [
  { value: 'NORMAL', label: '일반' },
  { value: 'ISA', label: 'ISA' },
  { value: 'IRP', label: 'IRP' },
  { value: 'PS', label: '연금저축' },
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number]['value'];

const TYPE_LABELS = new Map<string, string>(ACCOUNT_TYPES.map((t) => [t.value, t.label]));

/** 계좌 타입 → 한국어 이름 (모르는 값은 그대로) */
export const accountTypeLabel = (value: string): string => TYPE_LABELS.get(value) ?? value;

/** 계좌를 이름 붙이는 데 필요한 값 (GET /accounts 항목, accountAmounts 항목 모두 맞는다) */
export interface AccountLike {
  securityCompany: string;
  accountType: string;
}

type WithId = AccountLike & { id: number };

/** 같은 증권사·타입 계좌가 둘 이상이면 구분하도록 ' #id'를 붙인다 */
function suffix(account: WithId | (AccountLike & { accountId: number }), all?: readonly WithId[]) {
  const id = 'id' in account ? account.id : account.accountId;
  if (!all) return '';
  const same = all.filter(
    (a) => a.securityCompany === account.securityCompany && a.accountType === account.accountType,
  );
  return same.length > 1 ? ` #${id}` : '';
}

/** 계좌 정식 이름: "토스증권 · ISA" (같은 증권사·타입이 여러 개면 " #id") */
export function accountLabel(
  account: WithId | (AccountLike & { accountId: number }),
  all?: readonly WithId[],
): string {
  return `${securityCompanyLabel(account.securityCompany)} · ${accountTypeLabel(account.accountType)}${suffix(account, all)}`;
}

/** 칩처럼 좁은 곳에 쓰는 이름: "토스", 일반 계좌가 아니면 "토스 ISA" (같은 증권사·타입이 여러 개면 " #id") */
export function accountShortLabel(
  account: WithId | (AccountLike & { accountId: number }),
  all?: readonly WithId[],
): string {
  const base = securityCompanyShortLabel(account.securityCompany);
  const type = account.accountType === 'NORMAL' ? '' : ` ${accountTypeLabel(account.accountType)}`;
  return `${base}${type}${suffix(account, all)}`;
}

/** URL 쿼리 등 외부 값이 양의 정수일 때만 그 값을, 아니면 undefined */
export function parseAccountId(value: string | null | undefined): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : undefined;
}

/** 종목 상세 경로. 계좌 필터가 있으면 쿼리로 넘겨 상세에서도 같은 계좌 매수분을 보게 한다 */
export const securityDetailPath = (securityId: string, accountId?: number): string =>
  `/securities/${encodeURIComponent(securityId)}${accountId ? `?accountId=${accountId}` : ''}`;

/**
 * 그 증권사로 등록할 때 고를 계좌: preferredId가 그 증권사 계좌면 그것, 아니면 그 증권사의 첫 계좌(id 순),
 * 그 증권사 계좌가 없으면 null (백엔드가 일반 계좌를 새로 만든다)
 */
export function defaultAccountId(
  securityCompany: string | null,
  accounts: readonly WithId[] | undefined,
  preferredId?: number | null,
): number | null {
  if (!securityCompany || !accounts) return null;
  const own = accounts.filter((a) => a.securityCompany === securityCompany);
  return (own.find((a) => a.id === preferredId) ?? own[0])?.id ?? null;
}

/**
 * 매수 등록 창의 처음 증권사·계좌.
 * 페이지의 계좌 필터(initialAccountId)가 목록에 있으면 그 계좌, 아니면 마지막으로 쓴 증권사·계좌, 없으면 미선택
 */
export function initialRegisterAccount(
  initialAccountId: number | undefined,
  accounts: readonly (WithId & { securityCompany: SecurityCompany })[] | undefined,
  last: LastAccount | null,
): { securityCompany: SecurityCompany | null; accountId: number | null } {
  const initial = initialAccountId ? accounts?.find((a) => a.id === initialAccountId) : undefined;
  if (initial) return { securityCompany: initial.securityCompany, accountId: initial.id };
  if (!last) return { securityCompany: null, accountId: null };
  return {
    securityCompany: last.securityCompany,
    accountId: accounts
      ? defaultAccountId(last.securityCompany, accounts, last.accountId)
      : (last.accountId ?? null),
  };
}

/** 마지막으로 등록에 쓴 증권사·계좌 (브라우저별 편의 기능, 저장소를 못 쓰면 무시) */
const LAST_KEY = 'income.lastAccount';

export interface LastAccount {
  securityCompany: SecurityCompany;
  /** 생략하면 그 증권사의 첫 계좌 */
  accountId?: number;
}

export function loadLastAccount(): LastAccount | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { securityCompany, accountId } = parsed as Record<string, unknown>;
    const company = parseSecurityCompany(typeof securityCompany === 'string' ? securityCompany : null);
    if (!company) return null;
    const id = typeof accountId === 'number' ? parseAccountId(String(accountId)) : undefined;
    return id ? { securityCompany: company, accountId: id } : { securityCompany: company };
  } catch {
    return null;
  }
}

export function saveLastAccount(value: LastAccount): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(value));
  } catch {
    /* 저장소 사용 불가 환경은 무시 */
  }
}
