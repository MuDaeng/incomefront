import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useSellBalance } from '../api/queries';
import type { PurchaseHistoryItem, SecurityInfo } from '../api/types';
import { formatDate, formatPrice, formatQuantity, isPositiveDecimal } from '../lib/format';
import { KeyValue } from './common';
import { useNotify } from './Notifier';

export function SellDialog({
  security,
  purchase,
  onClose,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!purchase} onClose={onClose} fullWidth maxWidth="xs">
      {purchase && <SellForm security={security} purchase={purchase} onClose={onClose} />}
    </Dialog>
  );
}

function SellForm({
  security,
  purchase,
  onClose,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem;
  onClose: () => void;
}) {
  const notify = useNotify();
  const sell = useSellBalance();
  const [amount, setAmount] = useState(purchase.amount);
  const [saleDate, setSaleDate] = useState<Dayjs | null>(dayjs());

  const tooMany = isPositiveDecimal(amount) && Number(amount) > Number(purchase.amount);
  const amountError = (amount !== '' && !isPositiveDecimal(amount)) || tooMany;
  const purchaseDay = dayjs(purchase.purchaseDate);
  const dateError = !!saleDate && saleDate.isBefore(purchaseDay, 'day');
  const canSubmit =
    isPositiveDecimal(amount) && !tooMany && !!saleDate?.isValid() && !dateError && !sell.isPending;

  const submit = () => {
    if (!canSubmit || !saleDate) return;
    sell.mutate(
      {
        securityId: security.id,
        purchaseDate: purchase.purchaseDate,
        sequence: purchase.sequence,
        amount,
        saleDate: saleDate.format('YYYY-MM-DD'),
      },
      {
        onSuccess: () => {
          notify(`${security.name} ${formatQuantity(amount)}주 매도를 등록했습니다.`);
          onClose();
        },
      },
    );
  };

  return (
    <>
      <DialogTitle>매도 등록</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Stack sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <KeyValue label="종목" value={security.name} />
            <KeyValue label="매수일" value={formatDate(purchase.purchaseDate)} />
            <KeyValue label="매수 단가" value={formatPrice(purchase.price, security.currency)} />
            <KeyValue label="보유 수량" value={`${formatQuantity(purchase.amount)}주`} />
          </Stack>
          <TextField
            label="매도 수량"
            value={amount}
            onChange={(e) => setAmount(e.target.value.trim())}
            error={amountError}
            helperText={
              tooMany
                ? '매도 수량이 보유 수량보다 많습니다.'
                : amountError
                  ? '0보다 큰 숫자를 입력하세요.'
                  : '일부만 매도하면 남은 수량은 계속 보유합니다.'
            }
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={() => setAmount(purchase.amount)}>
                      전량
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
          <DatePicker
            label="매도일"
            value={saleDate}
            onChange={setSaleDate}
            minDate={purchaseDay}
            disableFuture
            format="YYYY.MM.DD"
            slotProps={{
              textField: {
                fullWidth: true,
                error: dateError,
                helperText: dateError ? '매도일은 매수일과 같거나 이후여야 합니다.' : ' ',
              },
            }}
          />
          {sell.error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {sell.error.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          취소
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={submit}
          disabled={!canSubmit}
          loading={sell.isPending}
        >
          매도
        </Button>
      </DialogActions>
    </>
  );
}
