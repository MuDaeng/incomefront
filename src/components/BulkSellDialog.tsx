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
import { useBulkSellBalance } from '../api/queries';
import type { Account, AccountAmount, SecurityInfo } from '../api/types';
import { formatQuantity, isPositiveDecimal } from '../lib/format';
import { accountLabel } from '../lib/account';
import { AccountSelect } from './AccountSelect';
import { KeyValue } from './common';
import { useNotify } from './Notifier';

/** 계좌별 일괄매도: 고른 계좌의 미매도 매수분을 매수일이 최근인 순으로 수량만큼 매도 (LIFO) */
export function BulkSellDialog({
  open,
  security,
  accountAmounts,
  accounts,
  initialAccountId,
  onClose,
}: {
  open: boolean;
  security: SecurityInfo;
  /** 계좌별 보유 수량 (GET /balance/purchases의 accountAmounts) */
  accountAmounts: AccountAmount[];
  /** 계좌 이름에서 같은 증권사·타입 계좌를 구분할 때 쓴다 */
  accounts?: readonly Account[];
  /** 페이지의 계좌 필터 */
  initialAccountId?: number;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      {open && (
        <BulkSellForm
          security={security}
          accountAmounts={accountAmounts}
          accounts={accounts}
          initialAccountId={initialAccountId}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function BulkSellForm({
  security,
  accountAmounts,
  accounts,
  initialAccountId,
  onClose,
}: {
  security: SecurityInfo;
  accountAmounts: AccountAmount[];
  accounts?: readonly Account[];
  initialAccountId?: number;
  onClose: () => void;
}) {
  const notify = useNotify();
  const sell = useBulkSellBalance();
  // 보유 수량이 있는 계좌만 고를 수 있다 (이름은 전체 계좌 목록 기준으로 붙인다)
  const options: Account[] = accountAmounts.map((a) => ({
    id: a.accountId,
    securityCompany: a.securityCompany,
    accountType: a.accountType,
  }));
  // 필터의 계좌 → 보유 계좌가 하나뿐이면 그 계좌 → 미선택
  const [accountId, setAccountId] = useState<number | null>(() => {
    if (initialAccountId && options.some((o) => o.id === initialAccountId)) return initialAccountId;
    return options.length === 1 ? options[0].id : null;
  });
  const selected = accountAmounts.find((a) => a.accountId === accountId) ?? null;
  const held = selected?.amount ?? null;
  const [amount, setAmount] = useState(held ?? '');
  const [saleDate, setSaleDate] = useState<Dayjs | null>(dayjs());

  const tooMany = held !== null && isPositiveDecimal(amount) && Number(amount) > Number(held);
  const amountError = (amount !== '' && !isPositiveDecimal(amount)) || tooMany;
  const canSubmit =
    !!selected && isPositiveDecimal(amount) && !tooMany && !!saleDate?.isValid() && !sell.isPending;

  const changeAccount = (value: number | null) => {
    setAccountId(value);
    // 계좌를 바꾸면 그 계좌의 전량으로 다시 채운다
    setAmount(accountAmounts.find((a) => a.accountId === value)?.amount ?? '');
    sell.reset();
  };

  const submit = () => {
    if (!canSubmit || !selected || !saleDate) return;
    sell.mutate(
      {
        securityId: security.id,
        securityCompany: selected.securityCompany,
        accountId: selected.accountId,
        amount,
        saleDate: saleDate.format('YYYY-MM-DD'),
      },
      {
        onSuccess: () => {
          notify(
            `${security.name} ${accountLabel(selected, accounts)} ${formatQuantity(amount)}주 일괄매도를 등록했습니다.`,
          );
          onClose();
        },
      },
    );
  };

  return (
    <>
      <DialogTitle>계좌별 일괄매도</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <AccountSelect
            value={accountId}
            onChange={changeAccount}
            accounts={options}
            required
          />
          <Stack sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <KeyValue label="종목" value={security.name} />
            <KeyValue label="보유 수량" value={held === null ? '-' : `${formatQuantity(held)}주`} />
          </Stack>
          <TextField
            label="매도 수량"
            value={amount}
            onChange={(e) => setAmount(e.target.value.trim())}
            error={amountError}
            disabled={!selected}
            helperText={
              tooMany
                ? '매도 수량이 이 계좌의 보유 수량보다 많습니다.'
                : amountError
                  ? '0보다 큰 숫자를 입력하세요.'
                  : '매수일이 최근인 매수분부터 차례로 매도합니다.'
            }
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" disabled={held === null} onClick={() => held && setAmount(held)}>
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
            disableFuture
            format="YYYY.MM.DD"
            slotProps={{
              textField: {
                fullWidth: true,
                helperText: '매도일 이후에 산 매수분은 매도하지 않습니다.',
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
          일괄매도
        </Button>
      </DialogActions>
    </>
  );
}
