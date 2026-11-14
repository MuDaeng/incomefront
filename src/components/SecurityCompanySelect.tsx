import { Autocomplete, TextField } from '@mui/material';
import type { Ref } from 'react';
import { SECURITY_COMPANIES, type SecurityCompany } from '../lib/securityCompany';

type Option = { value: SecurityCompany | null; label: string };

const ALL_OPTION: Option = { value: null, label: '전체 증권사' };
const OPTIONS: Option[] = SECURITY_COMPANIES.map((c) => ({ value: c.value, label: c.label }));

/**
 * 증권사 선택. 이름을 쳐서 찾을 수 있다.
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
