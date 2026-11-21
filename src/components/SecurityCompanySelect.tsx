import { alpha, Autocomplete, Chip, MenuItem, Stack, TextField } from '@mui/material';
import type { Ref } from 'react';
import type { Account, AccountAmount } from '../api/types';
import { accountLabel, type AccountLike, accountShortLabel } from '../lib/account';
import {
  SECURITY_COMPANIES,
  securityCompanyColor,
  securityCompanyLabel,
  securityCompanyShortLabel,
  type SecurityCompany,
} from '../lib/securityCompany';

/**
 * 증권사를 색으로 구분하는 칩: 증권사 색의 옅은 배경·테두리 + 짧은 이름.
 * amount를 주면 이름 뒤에 수량을 붙인다(예: "토스 3"). showTitle이면 마우스를 올렸을 때 정식 이름을 보여 준다.
 */
export function SecurityCompanyChip({
  value,
  amount,
  showTitle = false,
  name: nameOverride,
  title: titleOverride,
}: {
  value: string;
  amount?: string;
  showTitle?: boolean;
  /** 짧은 증권사 이름 대신 쓸 이름 (계좌 칩: "토스 ISA") */
  name?: string;
  /** 마우스를 올렸을 때 보여 줄 이름 (주면 showTitle 무시) */
  title?: string;
}) {
  const color = securityCompanyColor(value);
  const name = nameOverride ?? securityCompanyShortLabel(value);
  return (
    <Chip
      size="small"
      label={amount === undefined ? name : `${name} ${amount}`}
      title={titleOverride ?? (showTitle ? securityCompanyLabel(value) : undefined)}
      sx={{
        height: 22,
        fontSize: 12,
        fontWeight: 600,
        bgcolor: alpha(color, 0.14),
        border: 1,
        borderColor: alpha(color, 0.45),
      }}
    />
  );
}

/** 계좌 칩: 증권사 색 + "토스" / "토스 ISA", 마우스를 올리면 "토스증권 · ISA" */
export function AccountChip({
  account,
  accounts,
  amount,
}: {
  account: AccountLike & { accountId: number };
  /** 같은 증권사·타입 계좌를 #id로 구분할 때 쓰는 전체 계좌 목록 */
  accounts?: readonly Account[];
  amount?: string;
}) {
  return (
    <SecurityCompanyChip
      value={account.securityCompany}
      name={accountShortLabel(account, accounts)}
      title={accountLabel(account, accounts)}
      amount={amount}
    />
  );
}

/**
 * 계좌별 보유 수량 칩 목록 (계좌가 1개여도 보여 준다). 비어 있으면 아무것도 그리지 않는다.
 * hideSingleAmount이면 계좌가 1개일 때 수량 없이 이름만 (총 수량과 같으므로).
 */
export function AccountAmountChips({
  accountAmounts,
  accounts,
  formatAmount,
  justify = 'flex-start',
  hideSingleAmount = false,
}: {
  accountAmounts: readonly AccountAmount[] | undefined;
  accounts?: readonly Account[];
  formatAmount: (amount: string) => string;
  justify?: 'flex-start' | 'flex-end';
  hideSingleAmount?: boolean;
}) {
  if (!accountAmounts || accountAmounts.length === 0) return null;
  const withAmount = !(hideSingleAmount && accountAmounts.length === 1);
  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: justify, mt: 0.5 }}
    >
      {accountAmounts.map((a) => (
        <AccountChip
          key={a.accountId}
          account={a}
          accounts={accounts}
          amount={withAmount ? formatAmount(a.amount) : undefined}
        />
      ))}
    </Stack>
  );
}

type Option = { value: SecurityCompany | null; label: string };

const ALL_OPTION: Option = { value: null, label: '전체 증권사' };
const OPTIONS: Option[] = SECURITY_COMPANIES.map((c) => ({ value: c.value, label: c.label }));

/**
 * 증권사 선택.
 * - companies를 주면(일괄등록의 고정 증권사처럼 몇 개뿐인 목록) 검색 없는 select
 * - 안 주면(매수 등록·계좌 추가 다이얼로그, 전체 증권사) 이름을 쳐서 찾는 Autocomplete
 * - 등록용: value가 null이면 미선택
 * - 필터용(allowAll): 맨 앞 "전체 증권사"를 고르면 null
 */
export function SecurityCompanySelect({
  value,
  onChange,
  allowAll = false,
  label = '증권사',
  size,
  required,
  autoFocus,
  width,
  inputRef,
  companies,
  disabled,
  helperText,
}: {
  value: SecurityCompany | null;
  onChange: (value: SecurityCompany | null) => void;
  allowAll?: boolean;
  label?: string;
  size?: 'small' | 'medium';
  required?: boolean;
  autoFocus?: boolean;
  width?: number | string;
  inputRef?: Ref<HTMLInputElement>;
  /** 주면 이 증권사만 옵션으로 (없으면 전체) */
  companies?: readonly SecurityCompany[];
  disabled?: boolean;
  helperText?: string;
}) {
  const base = companies ? OPTIONS.filter((o) => o.value && companies.includes(o.value)) : OPTIONS;
  const options = allowAll ? [ALL_OPTION, ...base] : base;
  const selected = options.find((o) => o.value === value) ?? (allowAll ? ALL_OPTION : null);

  // 몇 개뿐인 증권사 목록은 검색 없이 select로 고른다.
  // Select는 null 값을 못 쓰므로 "전체/미선택"을 ''로 둔다
  if (companies) {
    return (
      <TextField
        select
        value={selected?.value ?? ''}
        onChange={(e) => onChange((e.target.value as SecurityCompany | '') || null)}
        label={label}
        size={size}
        required={required}
        autoFocus={autoFocus}
        inputRef={inputRef}
        disabled={disabled}
        helperText={helperText}
        sx={width ? { width } : undefined}
      >
        {options.map((o) => (
          <MenuItem key={o.value ?? ''} value={o.value ?? ''}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <Autocomplete<Option, false, boolean>
      value={selected}
      onChange={(_, next) => onChange(next?.value ?? null)}
      options={options}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      // 필터는 항상 값이 있으므로(전체 포함) 지우기 버튼을 숨긴다
      disableClearable={allowAll}
      autoHighlight
      disabled={disabled}
      size={size}
      sx={width ? { width } : undefined}
      noOptionsText="일치하는 증권사가 없습니다."
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          autoFocus={autoFocus}
          inputRef={inputRef}
          helperText={helperText}
        />
      )}
    />
  );
}
