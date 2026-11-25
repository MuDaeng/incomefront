import Add from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutlined';
import {
  Alert,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccountType,
} from '../api/queries';
import type { Account } from '../api/types';
import { EmptyState, ErrorAlert, Loading, PageHeader } from '../components/common';
import { useNotify } from '../components/Notifier';
import { AccountChip, SecurityCompanySelect } from '../components/SecurityCompanySelect';
import { ACCOUNT_TYPES, accountLabel, type AccountType } from '../lib/account';
import type { SecurityCompany } from '../lib/securityCompany';

/** 계좌 관리: 내 계좌 목록, 계좌 타입 변경, 계좌 추가·삭제 */
export function AccountsPage() {
  const { data: accounts, isLoading, error, refetch } = useAccounts();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Account | null>(null);

  const addButton = (
    <Button variant="contained" startIcon={<Add />} onClick={() => setCreating(true)}>
      계좌 추가
    </Button>
  );

  return (
    <>
      <PageHeader
        title="계좌 관리"
        subtitle="증권사·계좌 타입별로 매수 기록을 나눠 봅니다. 매수 등록 때 그 증권사 계좌가 없으면 일반 계좌가 자동으로 만들어집니다."
        action={addButton}
      />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      ) : !accounts || accounts.length === 0 ? (
        <Card>
          <EmptyState
            title="아직 계좌가 없어요"
            description="계좌를 추가하거나, 매수를 등록하면 그 증권사의 일반 계좌가 만들어집니다."
            action={addButton}
          />
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>계좌</TableCell>
                  <TableCell>계좌 타입</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    accounts={accounts}
                    onDelete={() => setDeleting(account)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <CreateAccountDialog open={creating} onClose={() => setCreating(false)} />
      <DeleteAccountDialog
        account={deleting}
        accounts={accounts}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function AccountRow({
  account,
  accounts,
  onDelete,
}: {
  account: Account;
  accounts: readonly Account[];
  onDelete: () => void;
}) {
  const notify = useNotify();
  const update = useUpdateAccountType();

  const changeType = (accountType: AccountType) => {
    if (accountType === account.accountType) return;
    update.mutate(
      { id: account.id, accountType },
      {
        onSuccess: (updated) => notify(`${accountLabel(updated, accounts)}(으)로 바꿨습니다.`),
        onError: (e) => notify(e.message, 'error'),
      },
    );
  };

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <AccountChip account={{ ...account, accountId: account.id }} accounts={accounts} />
      </TableCell>
      <TableCell>
        <TextField
          select
          size="small"
          value={account.accountType}
          onChange={(e) => changeType(e.target.value as AccountType)}
          disabled={update.isPending}
          sx={{ width: 140 }}
          slotProps={{ htmlInput: { 'aria-label': '계좌 타입' } }}
        >
          {ACCOUNT_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
      </TableCell>
      <TableCell align="right">
        <Tooltip title="계좌 삭제">
          <IconButton size="small" aria-label="계좌 삭제" onClick={onDelete}>
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

function CreateAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateAccount();
  const close = () => {
    if (create.isPending) return;
    create.reset();
    onClose();
  };
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      {open && <CreateAccountForm create={create} onClose={close} />}
    </Dialog>
  );
}

function CreateAccountForm({
  create,
  onClose,
}: {
  create: ReturnType<typeof useCreateAccount>;
  onClose: () => void;
}) {
  const notify = useNotify();
  const [securityCompany, setSecurityCompany] = useState<SecurityCompany | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('NORMAL');
  const canSave = !!securityCompany && !create.isPending;

  const save = () => {
    if (!canSave || !securityCompany) return;
    create.mutate(
      { securityCompany, accountType },
      {
        onSuccess: (account) => {
          notify(`${accountLabel(account)} 계좌를 추가했습니다.`);
          create.reset();
          onClose();
        },
      },
    );
  };

  return (
    <>
      <DialogTitle>계좌 추가</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <SecurityCompanySelect value={securityCompany} onChange={setSecurityCompany} required autoFocus />
          <TextField
            select
            label="계좌 타입"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
          >
            {ACCOUNT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          {create.error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {create.error.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={create.isPending}>
          취소
        </Button>
        <Button variant="contained" onClick={save} disabled={!canSave} loading={create.isPending}>
          추가
        </Button>
      </DialogActions>
    </>
  );
}

function DeleteAccountDialog({
  account,
  accounts,
  onClose,
}: {
  account: Account | null;
  accounts: readonly Account[] | undefined;
  onClose: () => void;
}) {
  const notify = useNotify();
  const remove = useDeleteAccount();
  const close = () => {
    if (remove.isPending) return;
    remove.reset();
    onClose();
  };

  const submit = () => {
    if (!account) return;
    const label = accountLabel(account, accounts);
    remove.mutate(account.id, {
      onSuccess: () => {
        notify(`${label} 계좌를 삭제했습니다.`);
        remove.reset();
        onClose();
      },
    });
  };

  return (
    <Dialog open={!!account} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>계좌를 삭제할까요?</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            {account && accountLabel(account, accounts)} 계좌를 삭제합니다. 매수 내역(매도분 포함)이 남아 있으면
            삭제할 수 없으니, 종목 상세의 계좌 이동이나 삭제로 먼저 정리하세요.
          </DialogContentText>
          {remove.error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {remove.error.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close} color="inherit" disabled={remove.isPending}>
          취소
        </Button>
        <Button variant="contained" color="error" onClick={submit} loading={remove.isPending}>
          삭제
        </Button>
      </DialogActions>
    </Dialog>
  );
}
