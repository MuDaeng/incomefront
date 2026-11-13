import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useSecuritySearch } from '../api/queries';
import type { Currency } from '../api/types';
import { formatDate, formatPrice } from '../lib/format';
import { useDebounced } from '../lib/useDebounced';

export interface SecurityOption {
  id: string;
  symbol: string;
  name: string;
  currency: Currency;
  closingPrice?: string | null;
  priceDate?: string | null;
}

export function CurrencyChip({ currency }: { currency: Currency }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={currency === 'KRW' ? '국내' : '미국'}
      color={currency === 'KRW' ? 'primary' : 'secondary'}
      sx={{ height: 20, fontSize: 11 }}
    />
  );
}

export function SecuritySearch({
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  value: SecurityOption | null;
  onChange: (value: SecurityOption | null) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [input, setInput] = useState('');
  const keyword = useDebounced(input.trim(), 300);
  const { data, isFetching, error } = useSecuritySearch(keyword);

  // 선택된 값의 라벨이 입력창에 있을 때는 검색하지 않음
  const isShowingSelection = value !== null && input === optionLabel(value);
  const options: SecurityOption[] = isShowingSelection || !keyword ? (value ? [value] : []) : (data ?? []);

  return (
    <Autocomplete<SecurityOption>
      value={value}
      onChange={(_, next) => onChange(next)}
      inputValue={input}
      onInputChange={(_, next) => setInput(next)}
      options={options}
      filterOptions={(x) => x}
      getOptionLabel={optionLabel}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={isFetching}
      disabled={disabled}
      noOptionsText={
        error
          ? '검색 중 오류가 발생했습니다.'
          : keyword
            ? '검색 결과가 없습니다.'
            : '종목명 또는 티커/종목코드를 입력하세요.'
      }
      loadingText="검색 중…"
      renderOption={({ key, ...props }, option) => (
        <Box component="li" key={key} {...props}>
          <Stack direction="row" spacing={1.5} sx={{ width: '100%', alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.symbol}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {option.closingPrice ? formatPrice(option.closingPrice, option.currency) : '시세 없음'}
              </Typography>
              {option.priceDate && (
                <Typography variant="caption" color="text.secondary">
                  {formatDate(option.priceDate)}
                </Typography>
              )}
            </Box>
            <CurrencyChip currency={option.currency} />
          </Stack>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="종목"
          placeholder="예: 삼성전자, 005930, SCHD"
          autoFocus={autoFocus}
        />
      )}
    />
  );
}

const optionLabel = (o: SecurityOption) => `${o.name} (${o.symbol})`;
