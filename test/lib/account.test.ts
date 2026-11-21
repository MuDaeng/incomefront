import type { Account } from '../../src/api/types';
import {
  ACCOUNT_TYPES,
  accountLabel,
  accountShortLabel,
  accountTypeLabel,
  defaultAccountId,
  initialRegisterAccount,
  loadLastAccount,
  parseAccountId,
  saveLastAccount,
  securityDetailPath,
} from '../../src/lib/account';

const accounts: Account[] = [
  { id: 1, securityCompany: 'TOSS', accountType: 'NORMAL' },
  { id: 2, securityCompany: 'KIWOOM', accountType: 'ISA' },
  { id: 3, securityCompany: 'TOSS', accountType: 'NORMAL' },
  { id: 4, securityCompany: 'TOSS', accountType: 'PS' },
];

describe('account', () => {
  it('계좌 타입은 백엔드 enum 순서, 한국어 이름', () => {
    expect(ACCOUNT_TYPES.map((t) => t.value)).toEqual(['NORMAL', 'ISA', 'IRP', 'PS']);
    expect(accountTypeLabel('PS')).toBe('연금저축');
    expect(accountTypeLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('계좌 이름: 같은 증권사·타입 계좌가 여러 개일 때만 #id', () => {
    expect(accountLabel(accounts[1], accounts)).toBe('키움증권 · ISA');
    expect(accountLabel(accounts[0], accounts)).toBe('토스증권 · 일반 #1');
    expect(accountLabel(accounts[3], accounts)).toBe('토스증권 · 연금저축');
    expect(accountLabel(accounts[0])).toBe('토스증권 · 일반');
    // accountAmounts 항목(accountId)도 받는다
    expect(
      accountLabel({ accountId: 3, securityCompany: 'TOSS', accountType: 'NORMAL' }, accounts),
    ).toBe('토스증권 · 일반 #3');
  });

  it('짧은 이름: 일반 계좌는 증권사만', () => {
    expect(accountShortLabel(accounts[3], accounts)).toBe('토스 연금저축');
    expect(accountShortLabel(accounts[1])).toBe('키움 ISA');
    expect(accountShortLabel(accounts[0])).toBe('토스');
    expect(accountShortLabel(accounts[2], accounts)).toBe('토스 #3');
  });

  it('양의 정수만 계좌 id로 파싱', () => {
    expect(parseAccountId('3')).toBe(3);
    expect(parseAccountId('0')).toBeUndefined();
    expect(parseAccountId('-1')).toBeUndefined();
    expect(parseAccountId('1.5')).toBeUndefined();
    expect(parseAccountId('01')).toBeUndefined();
    expect(parseAccountId('abc')).toBeUndefined();
    expect(parseAccountId('')).toBeUndefined();
    expect(parseAccountId(null)).toBeUndefined();
    expect(parseAccountId('99999999999999999999')).toBeUndefined();
  });

  it('종목 상세 경로에 계좌 필터를 쿼리로 붙인다', () => {
    expect(securityDetailPath('KR7005930003')).toBe('/securities/KR7005930003');
    expect(securityDetailPath('KR7005930003', 2)).toBe('/securities/KR7005930003?accountId=2');
    expect(securityDetailPath('A B/C')).toBe('/securities/A%20B%2FC');
  });

  it('등록 계좌 기본값: 원하는 계좌가 그 증권사 것이면 그것, 아니면 첫 계좌, 없으면 null', () => {
    expect(defaultAccountId('TOSS', accounts)).toBe(1);
    expect(defaultAccountId('TOSS', accounts, 4)).toBe(4);
    expect(defaultAccountId('TOSS', accounts, 2)).toBe(1);
    expect(defaultAccountId('SAMSUNG', accounts)).toBeNull();
    expect(defaultAccountId(null, accounts)).toBeNull();
    expect(defaultAccountId('TOSS', undefined)).toBeNull();
  });

  describe('initialRegisterAccount', () => {
    it('페이지 필터 계좌가 있으면 그 계좌', () => {
      expect(initialRegisterAccount(2, accounts, { securityCompany: 'TOSS' })).toEqual({
        securityCompany: 'KIWOOM',
        accountId: 2,
      });
    });

    it('필터가 없거나 목록에 없으면 마지막 증권사·계좌', () => {
      expect(initialRegisterAccount(undefined, accounts, { securityCompany: 'TOSS', accountId: 4 })).toEqual({
        securityCompany: 'TOSS',
        accountId: 4,
      });
      expect(initialRegisterAccount(99, accounts, { securityCompany: 'TOSS', accountId: 2 })).toEqual({
        securityCompany: 'TOSS',
        accountId: 1,
      });
      expect(initialRegisterAccount(undefined, accounts, { securityCompany: 'SAMSUNG' })).toEqual({
        securityCompany: 'SAMSUNG',
        accountId: null,
      });
    });

    it('목록을 아직 못 받았으면 마지막 값을 그대로, 아무것도 없으면 미선택', () => {
      expect(initialRegisterAccount(2, undefined, { securityCompany: 'TOSS', accountId: 3 })).toEqual({
        securityCompany: 'TOSS',
        accountId: 3,
      });
      expect(initialRegisterAccount(undefined, accounts, null)).toEqual({
        securityCompany: null,
        accountId: null,
      });
    });
  });

  it('마지막 증권사·계좌를 저장하고 읽는다 (잘못 저장된 값은 null)', () => {
    localStorage.clear();
    expect(loadLastAccount()).toBeNull();
    saveLastAccount({ securityCompany: 'SAMSUNG', accountId: 5 });
    expect(loadLastAccount()).toEqual({ securityCompany: 'SAMSUNG', accountId: 5 });
    saveLastAccount({ securityCompany: 'KB' });
    expect(loadLastAccount()).toEqual({ securityCompany: 'KB' });
    localStorage.setItem('income.lastAccount', '{"securityCompany":"NOPE"}');
    expect(loadLastAccount()).toBeNull();
    localStorage.setItem('income.lastAccount', 'not json');
    expect(loadLastAccount()).toBeNull();
    localStorage.setItem('income.lastAccount', '{"securityCompany":"KB","accountId":-1}');
    expect(loadLastAccount()).toEqual({ securityCompany: 'KB' });
  });
});
