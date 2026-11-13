import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useDailyPrices, useRegisterBalance } from '../api/queries';
import { formatDate, formatMoney, formatPrice, isPositiveDecimal } from '../lib/format';
import { useNotify } from './Notifier';
import { SecurityOption, SecuritySearch } from './SecuritySearch';

const ISO = 'YYYY-MM-DD';

export function RegisterPurchaseDialog({
  open,
  onClose,
  initialSecurity,
}: {
  open: boolean;
  onClose: () => void;
  initialSecurity?: SecurityOption | null;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <RegisterPurchaseForm onClose={onClose} initialSecurity={initialSecurity ?? null} />
    </Dialog>
  );
}

function RegisterPurchaseForm({
  onClose,
  initialSecurity,
}: {
  onClose: () => void;
  initialSecurity: SecurityOption | null;
}) {
  const notify = useNotify();
  const register = useRegisterBalance();

  const [security, setSecurity] = useState<SecurityOption | null>(initialSecurity);
  const [purchaseDate, setPurchaseDate] = useState<Dayjs | null>(
    initialSecurity?.priceDate ? dayjs(initialSecurity.priceDate) : dayjs(),
  );
  const [dateTouched, setDateTouched] = useState(false);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [priceTouched, setPriceTouched] = useState(false);
  const [sold, setSold] = useState(false);
  const [saleDate, setSaleDate] = useState<Dayjs | null>(null);

  const dateStr = purchaseDate?.isValid() ? purchaseDate.format(ISO) : undefined;
  const dayPrice = useDailyPrices(dateStr ? security?.id : undefined, dateStr, dateStr);
  const closing = dayPrice.data?.prices[0]?.closingPrice;
  const noPriceOnDate = !!dateStr && !!security && dayPrice.isSuccess && !closing;

  // 종목 선택 시 최근 거래일로 매수일 기본값 설정
  const handleSecurityChange = (next: SecurityOption | null) => {
    setSecurity(next);
    if (next?.priceDate && !dateTouched) setPurchaseDate(dayjs(next.priceDate));
  };

  // 매수일 종가로 매수가 자동 채우기 (직접 입력 전까지)
  useEffect(() => {
    if (closing && !priceTouched) setPrice(closing);
  }, [closing, priceTouched]);

  const amountError = amount !== '' && !isPositiveDecimal(amount);
  const priceError = price !== '' && !isPositiveDecimal(price);
  const saleBeforePurchase =
    sold && !!saleDate && !!purchaseDate && saleDate.isBefore(purchaseDate, 'day');

  const canSubmit =
    !!security &&
    !!dateStr &&
    isPositiveDecimal(amount) &&
    isPositiveDecimal(price) &&
    !noPriceOnDate &&
    (!sold || (!!saleDate?.isValid() && !saleBeforePurchase)) &&
    !register.isPending;

  const total =
    isPositiveDecimal(amount) && isPositiveDecimal(price) ? Number(amount) * Number(price) : null;

  const submit = () => {
    if (!canSubmit || !security || !dateStr) return;
    register.mutate(
      {
        securityId: security.id,
        purchaseDate: dateStr,
        amount,
        price,
        saleDate: sold && saleDate ? saleDate.format(ISO) : null,
      },
      {
        onSuccess: () => {
          notify(`${security.name} 매수 내역을 등록했습니다.`);
          onClose();
        },
      },
    );
  };

  return (
    <>
      <DialogTitle>매수 등록</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <SecuritySearch
            value={security}
            onChange={handleSecurityChange}
            autoFocus={!initialSecurity}
            disabled={!!initialSecurity}
          />

          <DatePicker
            label="매수일"
            value={purchaseDate}
            onChange={(v) => {
              setPurchaseDate(v);
              setDateTouched(true);
              setPriceTouched(false);
            }}
            disableFuture
            format="YYYY.MM.DD"
            slotProps={{
              textField: {
                fullWidth: true,
                error: noPriceOnDate,
                helperText: noPriceOnDate
                  ? '해당 매수일의 시세가 없습니다. 휴장일인지 확인해 주세요.'
                  : closing && security
                    ? `이날 종가 ${formatPrice(closing, security.currency)}`
                    : ' ',
              },
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="수량"
              value={amount}
              onChange={(e) => setAmount(e.target.value.trim())}
              error={amountError}
              helperText={amountError ? '0보다 큰 숫자를 입력하세요.' : ' '}
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'decimal' },
                input: { endAdornment: <InputAdornment position="end">주</InputAdornment> },
              }}
            />
            <TextField
              label="매수 단가"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value.trim());
                setPriceTouched(true);
              }}
              error={priceError}
              helperText={priceError ? '0보다 큰 숫자를 입력하세요.' : ' '}
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'decimal' },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {security?.currency === 'USD' ? 'USD' : '원'}
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          <Box>
            <FormControlLabel
              control={<Switch checked={sold} onChange={(e) => setSold(e.target.checked)} />}
              label="이미 매도한 내역이에요"
            />
            {sold && (
              <DatePicker
                label="매도일"
                value={saleDate}
                onChange={setSaleDate}
                disableFuture
                minDate={purchaseDate ?? undefined}
                format="YYYY.MM.DD"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mt: 1.5 },
                    error: saleBeforePurchase,
                    helperText: saleBeforePurchase ? '매도일은 매수일과 같거나 이후여야 합니다.' : ' ',
                  },
                }}
              />
            )}
          </Box>

          {total !== null && security && (
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', p: 2, borderRadius: 2, bgcolor: 'action.hover' }}
            >
              <Typography variant="body2" color="text.secondary">
                매수 금액
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {formatMoney(total, security.currency)}
              </Typography>
            </Stack>
          )}

          {register.error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {register.error.message}
            </Alert>
          )}
          {security?.priceDate && (
            <Typography variant="caption" color="text.secondary">
              최근 시세 기준일: {formatDate(security.priceDate)}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          취소
        </Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit} loading={register.isPending}>
          등록
        </Button>
      </DialogActions>
    </>
  );
}
