import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useBulkRegisterToss } from '../api/queries';
import type { BulkRegisterTossResponse, Currency, TossTransaction } from '../api/types';
import { EmptyState, KeyValue, PageHeader } from '../components/common';
import { useNotify } from '../components/Notifier';
import {
  FALL_COLOR,
  formatDate,
  formatExchangeRate,
  formatPrice,
  formatQuantity,
  RISE_COLOR,
} from '../lib/format';
import {
  parseTossTransactions,
  summarizeTossTransactions,
  TOSS_BODY_LIMIT_BYTES,
  TOSS_KIND_LABEL,
  type TossKind,
  tossRequestBodySize,
  tossSkipReason,
  tossTradeDate,
  tossTransactionKind,
} from '../lib/tossImport';

const numericSx = { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } as const;
const ROWS_PER_PAGE = 100;

type Step =
  | { name: 'input' }
  | { name: 'preview'; transactions: TossTransaction[] }
  | { name: 'result'; transactions: TossTransaction[]; result: BulkRegisterTossResponse };

/**
 * Toss 거래내역 일괄등록: JSON(파일·붙여넣기) 입력 → 그리드 미리보기 → 확인 후 POST /balance/toss.
 * 미리보기까지는 서버를 호출하지 않는다
 */
export function TossImportPage() {
  const [step, setStep] = useState<Step>({ name: 'input' });
  const [text, setText] = useState('');

  return (
    <>
      <PageHeader
        title="Toss 일괄등록"
        subtitle="토스증권 거래내역 JSON으로 토스증권 매수·매도 기록을 다시 등록합니다."
      />
      {step.name === 'input' && (
        <InputStep
          text={text}
          onTextChange={setText}
          onPreview={(transactions) => setStep({ name: 'preview', transactions })}
        />
      )}
      {step.name === 'preview' && (
        <PreviewStep
          transactions={step.transactions}
          onBack={() => setStep({ name: 'input' })}
          onDone={(result) => setStep({ name: 'result', transactions: step.transactions, result })}
        />
      )}
      {step.name === 'result' && (
        <ResultStep
          transactions={step.transactions}
          result={step.result}
          onRestart={() => {
            setText('');
            setStep({ name: 'input' });
          }}
        />
      )}
    </>
  );
}

function InputStep({
  text,
  onTextChange,
  onPreview,
}: {
  text: string;
  onTextChange: (text: string) => void;
  onPreview: (transactions: TossTransaction[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 나도록 비운다
    e.target.value = '';
    if (!file) return;
    try {
      onTextChange(await file.text());
      setFileName(file.name);
      setError(null);
    } catch {
      setError('파일을 읽지 못했습니다.');
    }
  };

  const preview = () => {
    const parsed = parseTossTransactions(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    onPreview(parsed.transactions);
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<UploadFileOutlined />}
              onClick={() => fileRef.current?.click()}
            >
              JSON 파일 선택
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={readFile}
            />
            <Typography variant="body2" color="text.secondary">
              {fileName ?? '또는 아래에 JSON을 붙여넣으세요.'}
            </Typography>
          </Stack>
          <TextField
            label="거래내역 JSON"
            placeholder='{ "transactionList": [ { "transactionType": "BUY", ... } ] }'
            value={text}
            onChange={(e) => {
              onTextChange(e.target.value);
              setFileName(null);
            }}
            multiline
            minRows={10}
            maxRows={20}
            fullWidth
            slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'monospace', fontSize: 13 } } }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Box>
            <Button variant="contained" onClick={preview} disabled={!text.trim()}>
              미리보기
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

type Filter = 'all' | Exclude<TossKind, 'other'> | 'skipped' | 'other';

const KIND_COLOR: Partial<Record<TossKind, string>> = { buy: RISE_COLOR, sell: FALL_COLOR };

function KindChip({ kind }: { kind: TossKind }) {
  const color = KIND_COLOR[kind];
  return (
    <Chip
      size="small"
      label={TOSS_KIND_LABEL[kind]}
      variant="outlined"
      sx={color ? { color, borderColor: color } : undefined}
    />
  );
}

function PreviewStep({
  transactions,
  onBack,
  onDone,
}: {
  transactions: TossTransaction[];
  onBack: () => void;
  onDone: (result: BulkRegisterTossResponse) => void;
}) {
  const notify = useNotify();
  const register = useBulkRegisterToss();
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const rows = useMemo(
    () =>
      transactions.map((tx, index) => ({
        index,
        tx,
        kind: tossTransactionKind(tx),
        tradeDate: tossTradeDate(tx),
        skipReason: tossSkipReason(tx),
      })),
    [transactions],
  );
  const summary = useMemo(() => summarizeTossTransactions(transactions), [transactions]);
  const bodySize = useMemo(() => tossRequestBodySize(transactions), [transactions]);
  const tooLarge = bodySize > TOSS_BODY_LIMIT_BYTES;

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (filter === 'all') return true;
        if (filter === 'skipped') return row.kind !== 'other' && row.skipReason !== null;
        return row.kind === filter;
      }),
    [rows, filter],
  );
  const pageRows = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: '전체', count: summary.total },
    { value: 'buy', label: '매수', count: summary.buy },
    { value: 'sell', label: '매도', count: summary.sell },
    { value: 'transferIn', label: '입고', count: summary.transferIn },
    { value: 'transferOut', label: '출고', count: summary.transferOut },
    { value: 'skipped', label: '제외 예상', count: summary.skipped },
    { value: 'other', label: '기타', count: summary.other },
  ];

  const submit = () => {
    if (!confirmed || tooLarge || register.isPending) return;
    register.mutate(
      { transactionList: transactions },
      {
        onSuccess: (result) => {
          notify(`Toss 거래내역 일괄등록을 마쳤습니다. (매수 ${result.boughtCount}건 · 매도 ${result.soldCount}건)`);
          onDone(result);
        },
      },
    );
  };

  return (
    <Stack spacing={2}>
      <Card>
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, pt: 2, pb: 1, flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, value: Filter | null) => {
              if (value) {
                setFilter(value);
                setPage(0);
              }
            }}
            sx={{ flexWrap: 'wrap' }}
          >
            {filters
              .filter((f) => f.value === 'all' || f.count > 0)
              .map((f) => (
                <ToggleButton key={f.value} value={f.value} sx={{ px: 1.5 }}>
                  {f.label} {f.count}
                </ToggleButton>
              ))}
          </ToggleButtonGroup>
        </Stack>
        {filtered.length === 0 ? (
          <EmptyState title="해당하는 거래가 없습니다." />
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 560 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align="right">#</TableCell>
                    <TableCell>거래일</TableCell>
                    <TableCell>유형</TableCell>
                    <TableCell>종목</TableCell>
                    <TableCell>시장</TableCell>
                    <TableCell align="right">수량</TableCell>
                    <TableCell align="right">단가</TableCell>
                    <TableCell align="right">환율</TableCell>
                    <TableCell>결제</TableCell>
                    <TableCell>비고</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageRows.map(({ index, tx, kind, tradeDate, skipReason }) => {
                    const currency: Currency = tx.currency === 'KRW' ? 'KRW' : 'USD';
                    return (
                      <TableRow key={index} hover sx={skipReason ? { opacity: 0.55 } : undefined}>
                        <TableCell align="right" sx={numericSx}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={numericSx}>{formatDate(tradeDate)}</TableCell>
                        <TableCell>
                          <KindChip kind={kind} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{tx.symbol ?? '-'}</TableCell>
                        <TableCell sx={numericSx}>
                          {tx.marketCountry} · {tx.currency}
                        </TableCell>
                        <TableCell align="right" sx={numericSx}>
                          {formatQuantity(tx.quantity)}
                        </TableCell>
                        <TableCell align="right" sx={numericSx}>
                          {tx.filledPrice === null ? '-' : formatPrice(tx.filledPrice, currency)}
                        </TableCell>
                        <TableCell align="right" sx={numericSx}>
                          {tx.exchangeRate === null ? '-' : formatExchangeRate(tx.exchangeRate)}
                        </TableCell>
                        <TableCell sx={numericSx}>{tx.settled ? '완료' : '미결제'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {skipReason && (
                            <Typography variant="caption" color="text.secondary">
                              {skipReason}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}건`}
            />
          </>
        )}
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              거래일은 서버 규칙(국내는 체결일, 미국은 KST 22시 이전이면 전날, 미결제는 결제일)으로 계산한 날짜입니다.
              입고는 체결가가 없어 입고일 이전 최근 종가로 등록되고, 시세가 없으면 서버에서 제외됩니다.
            </Typography>
            {tooLarge && (
              <Alert severity="error">
                요청 크기가 {(bodySize / 1024 / 1024).toFixed(2)}MB로 서버 한도(1MB)를 넘습니다.
              </Alert>
            )}
            <Alert severity="warning">
              일괄등록하면 기존 토스증권 매수·매도 기록을 모두 지우고 이 거래내역 {summary.total}건으로 다시
              등록합니다. 매도할 보유 수량이 모자라면 아무것도 바뀌지 않습니다.
            </Alert>
            <FormControlLabel
              control={
                <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              }
              label="위 거래내역을 확인했고, 기존 토스증권 기록을 덮어씁니다."
            />
            {register.error && (
              <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
                {register.error.message}
              </Alert>
            )}
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <Button color="inherit" onClick={onBack} disabled={register.isPending}>
                다시 입력
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={submit}
                disabled={!confirmed || tooLarge}
                loading={register.isPending}
              >
                일괄등록
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function ResultStep({
  transactions,
  result,
  onRestart,
}: {
  transactions: TossTransaction[];
  result: BulkRegisterTossResponse;
  onRestart: () => void;
}) {
  // skipped에는 isinCode만 오므로 입력 목록에서 심볼을 찾아 보여준다 (securityId는 화면에 노출하지 않음)
  const symbolByIsin = useMemo(() => {
    const map = new Map<string, string>();
    for (const tx of transactions) {
      if (tx.isinCode && tx.symbol) map.set(tx.isinCode, tx.symbol);
    }
    return map;
  }, [transactions]);

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack spacing={0.5} sx={{ maxWidth: 360 }}>
            <KeyValue label="삭제한 기존 기록" value={`${result.deletedCount}건`} />
            <KeyValue label="등록한 매수·입고" value={`${result.boughtCount}건`} />
            <KeyValue label="처리한 매도·출고" value={`${result.soldCount}건`} />
            <KeyValue label="건너뛴 거래" value={`${result.skipped.length}건`} />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" component={RouterLink} to="/">
              통합잔고로
            </Button>
            <Button color="inherit" onClick={onRestart}>
              새로 입력
            </Button>
          </Stack>
        </CardContent>
      </Card>
      {result.skipped.length > 0 && (
        <Card>
          <Typography variant="subtitle2" sx={{ px: 2, pt: 2 }}>
            건너뛴 거래
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>유형</TableCell>
                  <TableCell>종목</TableCell>
                  <TableCell>사유</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.skipped.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <KindChip kind={tossTransactionKind(s)} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {(s.isinCode && symbolByIsin.get(s.isinCode)) || '-'}
                    </TableCell>
                    <TableCell>{s.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Stack>
  );
}
