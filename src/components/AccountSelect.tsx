import { MenuItem, TextField } from '@mui/material';
import type { Ref } from 'react';
import type { Account } from '../api/types';
import { accountLabel } from '../lib/account';

/**
 * 계좌 선택 (검색 없는 select, 옵션 이름은 "토스증권 · ISA").
 * - allowAll이면 맨 앞 "전체 계좌"를 고를 때 null (페이지 필터)
 * - accounts를 아직 못 받았어도(로딩·실패) 선택된 값은 "계좌 #id"로 남겨 둔다
 */
export function AccountSelect({
  value,
  onChange,
  accounts,
  allowAll = false,
  allLabel = '전체 계좌',
  label = '계좌',
  size,
  required,
  disabled,
  helperText,
  width,
  fullWidth,
  autoFocus,
  inputRef,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  accounts: readonly Account[] | undefined;
  allowAll?: boolean;
  allLabel?: string;
  label?: string;
  size?: 'small' | 'medium';
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  width?: number | string;
  fullWidth?: boolean;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const list = accounts ?? [];
  const missing = value !== null && !list.some((a) => a.id === value);

  // Select는 null 값을 못 쓰므로 "전체/미선택"을 ''로 둔다
  return (
    <TextField
      select
      value={value === null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      label={label}
      size={size}
      required={required}
      disabled={disabled}
      helperText={helperText}
      fullWidth={fullWidth}
      autoFocus={autoFocus}
      inputRef={inputRef}
      sx={width ? { width } : undefined}
    >
      {allowAll && <MenuItem value="">{allLabel}</MenuItem>}
      {missing && <MenuItem value={String(value)}>계좌 #{value}</MenuItem>}
      {list.map((a) => (
        <MenuItem key={a.id} value={String(a.id)}>
          {accountLabel(a, list)}
        </MenuItem>
      ))}
    </TextField>
  );
}
