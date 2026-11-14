import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import { type KeyboardEvent, useState } from 'react';
import { useUpdateExchangeRate } from '../api/queries';
import type { PurchaseHistoryItem, SecurityInfo } from '../api/types';
import { formatDate, formatExchangeRate, formatPrice, formatQuantity, isPositiveDecimal } from '../lib/format';
import { isFieldEnter } from '../lib/keyboard';
import { KeyValue } from './common';
import { useNotify } from './Notifier';

/**
 * 매수분 하나의 구매 환율 수정 (USD 종목만). 매도된 매수분도 수정할 수 있다.
 * 저장된 환율이 있으면 지워서 매수일 환율로 되돌릴 수도 있다.
 */
export function EditExchangeRateDialog({
  security,
  purchase,
  onClose,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem | null;
  onClose: () => void;
}) {
  const update = useUpdateExchangeRate();

  const close = () => {
    if (update.isPending) return;
    update.reset();
    onClose();
  };

  return (
    <Dialog open={!!purchase} onClose={close} fullWidth maxWidth="xs">
      {purchase && (
        // 매수분이 바뀔 때마다 입력값을 새로 초기화
        <EditExchangeRateForm
          key={`${purchase.purchaseDate}-${purchase.sequence}`}
          security={security}
          purchase={purchase}
          update={update}
          onClose={close}
        />
      )}
    </Dialog>
  );
}

function EditExchangeRateForm({
  security,
  purchase,
  update,
  onClose,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem;
  update: ReturnType<typeof useUpdateExchangeRate>;
  onClose: () => void;
}) {
  const notify = useNotify();
  // exchangeRateDate가 null이면 저장된 구매 환율, 있으면 그날 종가 환율로 대체 중
  const hasStoredRate = !!purchase.exchangeRate && !purchase.exchangeRateDate;
  const [rate, setRate] = useState(hasStoredRate ? (purchase.exchangeRate ?? '') : '');
  const rateError = rate !== '' && !isPositiveDecimal(rate);
  const canSave = isPositiveDecimal(rate) && !update.isPending;

  const send = (exchangeRate: string | null) => {
    update.mutate(
      {
        securityId: security.id,
        purchaseDate: purchase.purchaseDate,
        sequence: purchase.sequence,
        exchangeRate,
      },
      {
        onSuccess: () => {
          notify(
            `${formatDate(purchase.purchaseDate)} 매수분 구매 환율을 ${exchangeRate === null ? '삭제' : '수정'}했습니다.`,
          );
          update.reset();
          onClose();
        },
      },
    );
  };

  const save = () => {
    if (canSave) send(rate);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!isFieldEnter(e)) return;
    e.preventDefault();
    save();
  };

  const helperText = rateError
    ? '0보다 큰 숫자를 입력하세요.'
    : !hasStoredRate && purchase.exchangeRate
      ? `현재 ${formatDate(purchase.exchangeRateDate)} 종가 환율 ${formatExchangeRate(purchase.exchangeRate)} 적용 중`
      : '실제로 환전한 환율(1달러당 원화)';

  return (
    <>
      <DialogTitle>구매 환율 수정</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <KeyValue label="종목" value={security.name} />
            <KeyValue
              label="매수일"
              value={`${formatDate(purchase.purchaseDate)} #${purchase.sequence}`}
            />
            <KeyValue label="매수 단가" value={formatPrice(purchase.price, security.currency)} />
            <KeyValue label="수량" value={`${formatQuantity(purchase.amount)}주`} />
          </Stack>
          <TextField
            label="구매 환율"
            value={rate}
            autoFocus
            onChange={(e) => setRate(e.target.value.trim())}
            onKeyDown={onKeyDown}
            error={rateError}
            helperText={helperText}
            fullWidth
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: { endAdornment: <InputAdornment position="end">원</InputAdornment> },
            }}
          />
          {update.error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {update.error.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {hasStoredRate && (
          <Button color="error" onClick={() => send(null)} disabled={update.isPending}>
            저장 환율 삭제
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="inherit" disabled={update.isPending}>
          취소
        </Button>
        <Button variant="contained" onClick={save} disabled={!canSave} loading={update.isPending}>
          저장
        </Button>
      </DialogActions>
    </>
  );
}
