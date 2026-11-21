import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { TAX_MODE_LABEL, type TaxMode } from '../lib/dividendTax';

/** 배당금 세전/세후 토글 */
export function TaxModeToggle({ value, onChange }: { value: TaxMode; onChange: (mode: TaxMode) => void }) {
  return (
    <Tooltip title="세후는 일반 계좌 배당만 원천징수를 뺀 금액이에요 (국내 15.4%, 미국 15%). ISA·IRP·연금저축은 세전과 같아요.">
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, v: TaxMode | null) => v && onChange(v)}
        aria-label="배당금 세전·세후"
      >
        {(['pre', 'after'] as const).map((mode) => (
          <ToggleButton key={mode} value={mode} sx={{ px: 1.5, py: 0.5 }}>
            {TAX_MODE_LABEL[mode]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Tooltip>
  );
}
