import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material';
import { useDeletePurchase } from '../api/queries';
import type { PurchaseHistoryItem, SecurityInfo } from '../api/types';
import { formatDate, formatPrice, formatQuantity } from '../lib/format';
import { KeyValue } from './common';
import { useNotify } from './Notifier';

/** 오등록한 매수분 삭제 확인. 매도된 매수분도 삭제할 수 있다 */
export function DeletePurchaseDialog({
  security,
  purchase,
  isLast,
  onClose,
  onDeleted,
}: {
  security: SecurityInfo;
  purchase: PurchaseHistoryItem | null;
  /** 이 종목의 마지막 매수분이면 삭제 후 보유 종목에서도 빠진다 */
  isLast: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const notify = useNotify();
  const remove = useDeletePurchase();

  const close = () => {
    if (remove.isPending) return;
    remove.reset();
    onClose();
  };

  const submit = () => {
    if (!purchase) return;
    remove.mutate(
      {
        securityId: security.id,
        purchaseDate: purchase.purchaseDate,
        sequence: purchase.sequence,
      },
      {
        onSuccess: () => {
          notify(`${formatDate(purchase.purchaseDate)} 매수 내역을 삭제했습니다.`);
          remove.reset();
          onClose();
          onDeleted?.();
        },
      },
    );
  };

  return (
    <Dialog open={!!purchase} onClose={close} fullWidth maxWidth="xs">
      {purchase && (
        <>
          <DialogTitle>매수 내역 삭제</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <DialogContentText>
                잘못 등록한 매수 내역을 삭제합니다. 삭제하면 되돌릴 수 없습니다.
              </DialogContentText>
              <Stack sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                <KeyValue label="종목" value={security.name} />
                <KeyValue
                  label="매수일"
                  value={`${formatDate(purchase.purchaseDate)} #${purchase.sequence}`}
                />
                <KeyValue label="매수 단가" value={formatPrice(purchase.price, security.currency)} />
                <KeyValue label="수량" value={`${formatQuantity(purchase.amount)}주`} />
                {purchase.saleDate && (
                  <KeyValue label="매도일" value={formatDate(purchase.saleDate)} />
                )}
              </Stack>
              {purchase.saleDate && (
                <Alert severity="warning">매도 기록도 함께 삭제됩니다.</Alert>
              )}
              {isLast && (
                <Alert severity="info">
                  이 종목의 마지막 매수 내역이라 통합잔고의 보유 종목에서도 빠집니다.
                </Alert>
              )}
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
            <Button
              variant="contained"
              color="error"
              onClick={submit}
              loading={remove.isPending}
            >
              삭제
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
