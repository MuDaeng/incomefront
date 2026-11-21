import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
} from '@mui/material';
import { type KeyboardEvent, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAccounts, useUpdatePurchaseAccount } from '../api/queries';
import type { PurchaseHistoryItem, SecurityInfo } from '../api/types';
import { accountLabel } from '../lib/account';
import { formatDate, formatPrice, formatQuantity } from '../lib/format';
import { isFieldEnter } from '../lib/keyboard';
import { AccountSelect } from './AccountSelect';
import { KeyValue } from './common';
import { useNotify } from './Notifier';

/** 매수분 하나를 내 다른 계좌로 이동 (타사 이전 등). 매도된 매수분도 옮길 수 있다 */
export function MovePurchaseAccountDialog({
  security,
  purchase,
  onClose,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem | null;
  onClose: () => void;
}) {
  const update = useUpdatePurchaseAccount();

  const close = () => {
    if (update.isPending) return;
    update.reset();
    onClose();
  };

  return (
    <Dialog open={!!purchase} onClose={close} fullWidth maxWidth="xs">
      {purchase && (
        // 매수분이 바뀔 때마다 선택값을 새로 초기화
        <MovePurchaseAccountForm
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

function MovePurchaseAccountForm({
  security,
  purchase,
  update,
  onClose,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem;
  update: ReturnType<typeof useUpdatePurchaseAccount>;
  onClose: () => void;
}) {
  const notify = useNotify();
  const { data: accounts, isLoading } = useAccounts();
  // 지금 계좌는 옮길 곳이 아니므로 뺀다
  const targets = accounts?.filter((a) => a.id !== purchase.accountId);
  const [accountId, setAccountId] = useState<number | null>(null);
  const target = targets?.find((a) => a.id === accountId);
  const canSave = !!target && !update.isPending;

  const save = () => {
    if (!canSave || !target) return;
    update.mutate(
      {
        securityId: security.id,
        purchaseDate: purchase.purchaseDate,
        sequence: purchase.sequence,
        accountId: target.id,
      },
      {
        onSuccess: () => {
          notify(
            `${formatDate(purchase.purchaseDate)} 매수분을 ${accountLabel(target, accounts)} 계좌로 옮겼습니다.`,
          );
          update.reset();
          onClose();
        },
      },
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!isFieldEnter(e)) return;
    e.preventDefault();
    save();
  };

  return (
    <>
      <DialogTitle>계좌 이동</DialogTitle>
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
            <KeyValue label="현재 계좌" value={accountLabel(purchase, accounts)} />
          </Stack>
          <Stack onKeyDown={onKeyDown}>
            <AccountSelect
              label="옮길 계좌"
              value={accountId}
              onChange={setAccountId}
              accounts={targets}
              required
              autoFocus
              disabled={isLoading || targets?.length === 0}
            />
          </Stack>
          {targets?.length === 0 && (
            <Alert severity="info">
              옮길 다른 계좌가 없습니다.{' '}
              <Link component={RouterLink} to="/accounts">
                계좌 관리
              </Link>
              에서 계좌를 먼저 추가하세요.
            </Alert>
          )}
          {update.error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {update.error.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button component={RouterLink} to="/accounts" color="inherit" sx={{ mr: 'auto' }}>
          계좌 관리
        </Button>
        <Button onClick={onClose} color="inherit" disabled={update.isPending}>
          취소
        </Button>
        <Button variant="contained" onClick={save} disabled={!canSave} loading={update.isPending}>
          이동
        </Button>
      </DialogActions>
    </>
  );
}
