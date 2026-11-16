import { alpha, Autocomplete, Chip, MenuItem, Stack, TextField } from '@mui/material';
import type { Ref } from 'react';
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
}: {
  value: string;
  amount?: string;
  showTitle?: boolean;
}) {
  const color = securityCompanyColor(value);
  const name = securityCompanyShortLabel(value);
  return (
    <Chip
      size="small"
      label={amount === undefined ? name : `${name} ${amount}`}
      title={showTitle ? securityCompanyLabel(value) : undefined}
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

/**
 * 증권사별 보유 수량 칩 목록 (증권사가 1곳이어도 보여 준다). 비어 있으면 아무것도 그리지 않는다.
 * hideSingleAmount이면 증권사가 1곳일 때 수량 없이 이름만 (총 수량과 같으므로).
 */
export function CompanyAmountChips({
  companyAmounts,
  formatAmount,
  justify = 'flex-start',
  hideSingleAmount = false,
}: {
  companyAmounts: readonly { securityCompany: string; amount: string }[] | undefined;
  formatAmount: (amount: string) => string;
  justify?: 'flex-start' | 'flex-end';
  hideSingleAmount?: boolean;
}) {
  if (!companyAmounts || companyAmounts.length === 0) return null;
  const withAmount = !(hideSingleAmount && companyAmounts.length === 1);
  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: justify, mt: 0.5 }}
    >
      {companyAmounts.map((c) => (
        <SecurityCompanyChip
          key={c.securityCompany}
          value={c.securityCompany}
          amount={withAmount ? formatAmount(c.amount) : undefined}
          showTitle
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
 * - companies를 주면(서버의 매수 기록 증권사로 거른 필터) 검색 없는 select
 * - 안 주면(등록·수정 다이얼로그, 전체 증권사) 이름을 쳐서 찾는 Autocomplete
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
}) {
  const base = companies ? OPTIONS.filter((o) => o.value && companies.includes(o.value)) : OPTIONS;
  const options = allowAll ? [ALL_OPTION, ...base] : base;
  const selected = options.find((o) => o.value === value) ?? (allowAll ? ALL_OPTION : null);

  // 서버에서 받은 증권사 목록(필터)은 몇 개뿐이라 검색 없이 select로 고른다.
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
        />
      )}
    />
  );
}
