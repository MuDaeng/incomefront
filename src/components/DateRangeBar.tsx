import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

export interface DateRange {
  from?: string;
  to?: string;
}

export interface RangePreset {
  key: string;
  label: string;
  range: () => DateRange;
}

const ISO = 'YYYY-MM-DD';
const today = () => dayjs().format(ISO);

export const PRESETS: Record<string, RangePreset> = {
  thisYear: {
    key: 'thisYear',
    label: '올해',
    range: () => ({ from: dayjs().startOf('year').format(ISO), to: dayjs().endOf('year').format(ISO) }),
  },
  lastYear: {
    key: 'lastYear',
    label: '작년',
    range: () => {
      const y = dayjs().subtract(1, 'year');
      return { from: y.startOf('year').format(ISO), to: y.endOf('year').format(ISO) };
    },
  },
  ytd: {
    key: 'ytd',
    label: '올해(오늘까지)',
    range: () => ({ from: dayjs().startOf('year').format(ISO), to: today() }),
  },
  last12m: {
    key: 'last12m',
    label: '최근 1년',
    range: () => ({ from: dayjs().subtract(1, 'year').add(1, 'day').format(ISO), to: today() }),
  },
  last3y: {
    key: 'last3y',
    label: '최근 3년',
    range: () => ({ from: dayjs().subtract(3, 'year').add(1, 'day').format(ISO), to: today() }),
  },
  all: { key: 'all', label: '전체', range: () => ({}) },
};

/** 프리셋 버튼 + 시작일/종료일 직접 선택 */
export function DateRangeBar({
  presets,
  presetKey,
  range,
  onChange,
  required,
}: {
  presets: RangePreset[];
  presetKey: string | null;
  range: DateRange;
  onChange: (range: DateRange, presetKey: string | null) => void;
  /** true면 시작일·종료일 모두 필수 (비울 수 없음) */
  required?: boolean;
}) {
  const from = range.from ? dayjs(range.from) : null;
  const to = range.to ? dayjs(range.to) : null;

  const changeDate = (which: 'from' | 'to', value: Dayjs | null) => {
    if (value && !value.isValid()) return;
    if (!value && required) return;
    const next = { ...range, [which]: value ? value.format(ISO) : undefined };
    // 시작일이 종료일보다 늦으면 다른 쪽을 맞춰줌
    if (next.from && next.to && next.from > next.to) {
      if (which === 'from') next.to = next.from;
      else next.from = next.to;
    }
    onChange(next, null);
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { md: 'center' }, mb: 3 }}
    >
      <ToggleButtonGroup
        size="small"
        exclusive
        value={presetKey}
        onChange={(_, key: string | null) => {
          const preset = presets.find((p) => p.key === key);
          if (preset) onChange(preset.range(), preset.key);
        }}
        sx={{ flexWrap: 'wrap' }}
      >
        {presets.map((p) => (
          <ToggleButton key={p.key} value={p.key} sx={{ px: 1.5 }}>
            {p.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <DatePicker
          label="시작일"
          value={from}
          onChange={(v) => changeDate('from', v)}
          format="YYYY.MM.DD"
          slotProps={{
            textField: { size: 'small', sx: { width: 160 } },
            field: { clearable: !required },
          }}
        />
        <span>~</span>
        <DatePicker
          label="종료일"
          value={to}
          onChange={(v) => changeDate('to', v)}
          format="YYYY.MM.DD"
          slotProps={{
            textField: { size: 'small', sx: { width: 160 } },
            field: { clearable: !required },
          }}
        />
      </Stack>
    </Stack>
  );
}
