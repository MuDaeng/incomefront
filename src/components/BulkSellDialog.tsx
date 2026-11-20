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
import type { CompanyAmount, SecurityInfo } from '../api/types';
import { formatQuantity, isPositiveDecimal } from '../lib/format';
import { type SecurityCompany, securityCompanyShortLabel } from '../lib/securityCompany';
import { KeyValue } from './common';
import { useNotify } from './Notifier';
import { SecurityCompanySelect } from './SecurityCompanySelect';

/** 증권사별 일괄매도: 고른 증권사의 미매도 매수분을 매수일이 최근인 순으로 수량만큼 매도 (LIFO) */
export function BulkSellDialog({
  open,
  security,
  companyAmounts,
  initialCompany,
  onClose,
}: {
  open: boolean;
  security: SecurityInfo;
  /** 증권사별 보유 수량 (GET /balance/purchases의 companyAmounts) */
  companyAmounts: CompanyAmount[];
  /** 페이지의 증권사 필터 */
  initialCompany?: SecurityCompany;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      {open && (
        <BulkSellForm
          security={security}
          companyAmounts={companyAmounts}
          initialCompany={initialCompany}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function BulkSellForm({
  security,
  companyAmounts,
  initialCompany,
  onClose,
}: {
  security: SecurityInfo;
  companyAmounts: CompanyAmount[];
  initialCompany?: SecurityCompany;
  onClose: () => void;
}) {
  const notify = useNotify();
  const sell = useBulkSellBalance();
  const companies = companyAmounts.map((c) => c.securityCompany);
  // 필터의 증권사 → 보유 증권사가 하나뿐이면 그 증권사 → 미선택
  const [company, setCompany] = useState<SecurityCompany | null>(() => {
    if (initialCompany && companies.includes(initialCompany)) return initialCompany;
    return companies.length === 1 ? companies[0] : null;
  });
  const held = companyAmounts.find((c) => c.securityCompany === company)?.amount ?? null;
  const [amount, setAmount] = useState(held ?? '');
  const [saleDate, setSaleDate] = useState<Dayjs | null>(dayjs());

  const tooMany = held !== null && isPositiveDecimal(amount) && Number(amount) > Number(held);
  const amountError = (amount !== '' && !isPositiveDecimal(amount)) || tooMany;
  const canSubmit =
    !!company && isPositiveDecimal(amount) && !tooMany && !!saleDate?.isValid() && !sell.isPending;

  const changeCompany = (value: SecurityCompany | null) => {
    setCompany(value);
    // 증권사를 바꾸면 그 증권사의 전량으로 다시 채운다
    setAmount(companyAmounts.find((c) => c.securityCompany === value)?.amount ?? '');
    sell.reset();
  };

  const submit = () => {
    if (!canSubmit || !company || !saleDate) return;
    sell.mutate(
      {
        securityId: security.id,
        securityCompany: company,
        amount,
        saleDate: saleDate.format('YYYY-MM-DD'),
      },
      {
        onSuccess: () => {
          notify(
            `${security.name} ${securityCompanyShortLabel(company)} ${formatQuantity(amount)}주 일괄매도를 등록했습니다.`,
          );
          onClose();
        },
      },
    );
  };

  return (
    <>
      <DialogTitle>증권사별 일괄매도</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <SecurityCompanySelect
            value={company}
            onChange={changeCompany}
            companies={companies}
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
            disabled={!company}
            helperText={
              tooMany
                ? '매도 수량이 이 증권사의 보유 수량보다 많습니다.'
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
