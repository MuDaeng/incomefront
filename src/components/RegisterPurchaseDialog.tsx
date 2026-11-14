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
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { useDailyPrices, useRegisterBalance } from '../api/queries';
import {
  formatDate,
  formatExchangeRate,
  formatMoney,
  formatPrice,
  formatQuantity,
  isPositiveDecimal,
  toPriceInput,
} from '../lib/format';
import { focusFirstField, isFieldEnter } from '../lib/keyboard';
import { staticFocusSx } from './common';
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
  const [exchangeRate, setExchangeRate] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Enter로 종목 → 매수일 → 수량 → 매수 단가 (→ USD는 구매 환율) 순서로 이동
  const dateBoxRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const exchangeRateRef = useRef<HTMLInputElement>(null);
  const onEnter = (action: () => void) => (e: KeyboardEvent<HTMLElement>) => {
    if (!isFieldEnter(e)) return;
    e.preventDefault();
    action();
  };

  const dateStr = purchaseDate?.isValid() ? purchaseDate.format(ISO) : undefined;
  const dayPrice = useDailyPrices(dateStr ? security?.id : undefined, dateStr, dateStr);
  const closing = dayPrice.data?.prices[0]?.closingPrice;
  const noPriceOnDate = !!dateStr && !!security && dayPrice.isSuccess && !closing;

  // 종목 선택 시 최근 거래일로 매수일 기본값 설정
  const handleSecurityChange = (next: SecurityOption | null) => {
    setSecurity(next);
    if (next?.priceDate && !dateTouched) setPurchaseDate(dayjs(next.priceDate));
  };

  // 매수일 종가로 매수가 자동 채우기 (직접 입력 전까지). 달러는 소수 2자리로 맞춘다
  const currency = security?.currency;
  useEffect(() => {
    if (closing && currency && !priceTouched) setPrice(toPriceInput(closing, currency));
  }, [closing, currency, priceTouched]);

  const amountError = amount !== '' && !isPositiveDecimal(amount);
  const priceError = price !== '' && !isPositiveDecimal(price);
  // 구매 환율은 USD 종목만, 선택 입력 (비우면 백엔드가 매수일 환율로 저장)
  const isUsd = currency === 'USD';
  const exchangeRateError = isUsd && exchangeRate !== '' && !isPositiveDecimal(exchangeRate);
  const saleBeforePurchase =
    sold && !!saleDate && !!purchaseDate && saleDate.isBefore(purchaseDate, 'day');

  const canSubmit =
    !!security &&
    !!dateStr &&
    isPositiveDecimal(amount) &&
    isPositiveDecimal(price) &&
    !noPriceOnDate &&
    !exchangeRateError &&
    (!sold || (!!saleDate?.isValid() && !saleBeforePurchase)) &&
    !register.isPending;

  const total =
    isPositiveDecimal(amount) && isPositiveDecimal(price) ? Number(amount) * Number(price) : null;

  // 등록 버튼(또는 마지막 칸에서 Enter) → 확인 창 → 확인 창의 등록에서 실제 등록
  const requestSubmit = () => {
    if (canSubmit) setConfirming(true);
  };

  const submit = () => {
    setConfirming(false);
    if (!canSubmit || !security || !dateStr) return;
    register.mutate(
      {
        securityId: security.id,
        purchaseDate: dateStr,
        amount,
        price,
        saleDate: sold && saleDate ? saleDate.format(ISO) : null,
        exchangeRate: isUsd && exchangeRate ? exchangeRate : null,
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
          <Box onKeyDown={onEnter(() => security && focusFirstField(dateBoxRef.current))}>
            <SecuritySearch
              value={security}
              onChange={handleSecurityChange}
              autoFocus={!initialSecurity}
              disabled={!!initialSecurity}
            />
          </Box>

          <Box ref={dateBoxRef} onKeyDown={onEnter(() => amountRef.current?.focus())}>
            <DatePicker
              label="매수일"
              value={purchaseDate}
              // 추가 매수(종목 고정)로 열리면 매수일부터 입력
              autoFocus={!!initialSecurity}
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
                      ? `이날 종가 ${formatMoney(closing, security.currency)}`
                      : ' ',
                },
              }}
            />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="수량"
              value={amount}
              inputRef={amountRef}
              // 매수 단가로 넘어가면 기존 값을 전체 선택해, 처음 입력하는 글자가 기존 값을 대체하게 한다
              onKeyDown={onEnter(() => {
                priceRef.current?.focus();
                priceRef.current?.select();
              })}
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
              inputRef={priceRef}
              onKeyDown={onEnter(() => (isUsd ? exchangeRateRef.current?.focus() : requestSubmit()))}
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

          {isUsd && (
            <TextField
              label="구매 환율 (선택)"
              value={exchangeRate}
              inputRef={exchangeRateRef}
              onKeyDown={onEnter(requestSubmit)}
              onChange={(e) => setExchangeRate(e.target.value.trim())}
              error={exchangeRateError}
              helperText={
                exchangeRateError
                  ? '0보다 큰 숫자를 입력하세요.'
                  : '실제로 환전한 환율(1달러당 원화). 비워 두면 매수일 환율로 저장합니다.'
              }
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'decimal' },
                input: { endAdornment: <InputAdornment position="end">원</InputAdornment> },
              }}
            />
          )}

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
        <Button
          variant="contained"
          onClick={requestSubmit}
          disabled={!canSubmit}
          loading={register.isPending}
        >
          등록
        </Button>
      </DialogActions>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        maxWidth="xs"
        fullWidth
        // 닫힌 뒤 원래 포커스(등록 버튼) 대신 마지막 입력칸(매수 단가, USD는 구매 환율)으로 돌아간다
        disableRestoreFocus
        slotProps={{
          transition: {
            onExited: () => (isUsd ? exchangeRateRef.current : priceRef.current)?.focus(),
          },
        }}
      >
        <DialogTitle>매수 내역을 등록할까요?</DialogTitle>
        <DialogContent>
          {security && (
            <Stack spacing={1}>
              <ConfirmRow label="종목">{security.name}</ConfirmRow>
              <ConfirmRow label="매수일">{dateStr ? formatDate(dateStr) : '-'}</ConfirmRow>
              <ConfirmRow label="수량">{formatQuantity(amount)}주</ConfirmRow>
              <ConfirmRow label="매수 단가">{formatPrice(price, security.currency)}</ConfirmRow>
              {total !== null && (
                <ConfirmRow label="매수 금액">
                  <strong>{formatMoney(total, security.currency)}</strong>
                </ConfirmRow>
              )}
              {isUsd && (
                <ConfirmRow label="구매 환율">
                  {exchangeRate ? formatExchangeRate(exchangeRate) : '매수일 환율 적용'}
                </ConfirmRow>
              )}
              {sold && saleDate?.isValid() && (
                <ConfirmRow label="매도일">{formatDate(saleDate.format(ISO))}</ConfirmRow>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirming(false)} color="inherit">
            취소
          </Button>
          {/* autoFocus: 확인 창이 뜬 상태에서 Enter 한 번 더 누르면 등록.
              포커스 펄스 애니메이션 대신 같은 색(글자색 30%)을 고정으로 덮는다 */}
          <Button
            variant="contained"
            onClick={submit}
            autoFocus
            disableFocusRipple
            sx={staticFocusSx}
          >
            등록
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ConfirmRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>
        {children}
      </Typography>
    </Stack>
  );
}
