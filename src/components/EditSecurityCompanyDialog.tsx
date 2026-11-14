import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { type KeyboardEvent, useState } from 'react';
import { useUpdateSecurityCompany } from '../api/queries';
import type { PurchaseHistoryItem, SecurityInfo } from '../api/types';
import { formatDate, formatPrice, formatQuantity } from '../lib/format';
import { isFieldEnter } from '../lib/keyboard';
import { type SecurityCompany, securityCompanyLabel } from '../lib/securityCompany';
import { KeyValue } from './common';
import { useNotify } from './Notifier';
import { SecurityCompanySelect } from './SecurityCompanySelect';

/** 매수분 하나의 증권사 수정. 매도된 매수분도 수정할 수 있다 */
export function EditSecurityCompanyDialog({
  security,
  purchase,
  onClose,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem | null;
  onClose: () => void;
}) {
  const update = useUpdateSecurityCompany();

  const close = () => {
    if (update.isPending) return;
    update.reset();
    onClose();
  };

  return (
    <Dialog open={!!purchase} onClose={close} fullWidth maxWidth="xs">
      {purchase && (
        // 매수분이 바뀔 때마다 선택값을 새로 초기화
        <EditSecurityCompanyForm
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

function EditSecurityCompanyForm({
  security,
  purchase,
  update,
  onClose,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem;
  update: ReturnType<typeof useUpdateSecurityCompany>;
  onClose: () => void;
}) {
  const notify = useNotify();
  const [company, setCompany] = useState<SecurityCompany | null>(purchase.securityCompany);
  const canSave = !!company && company !== purchase.securityCompany && !update.isPending;

  const save = () => {
    if (!canSave || !company) return;
    update.mutate(
      {
        securityId: security.id,
        purchaseDate: purchase.purchaseDate,
        sequence: purchase.sequence,
        securityCompany: company,
      },
      {
        onSuccess: () => {
          notify(
            `${formatDate(purchase.purchaseDate)} 매수분 증권사를 ${securityCompanyLabel(company)}(으)로 바꿨습니다.`,
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
      <DialogTitle>증권사 수정</DialogTitle>
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
            <KeyValue label="현재 증권사" value={securityCompanyLabel(purchase.securityCompany)} />
          </Stack>
          <Stack onKeyDown={onKeyDown}>
            <SecurityCompanySelect value={company} onChange={setCompany} required autoFocus />
          </Stack>
          {update.error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {update.error.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
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
