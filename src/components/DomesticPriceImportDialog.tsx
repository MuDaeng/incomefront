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
import { useImportDomesticDailyPrices } from '../api/queries';
import { formatDate } from '../lib/format';
import { useNotify } from './Notifier';

/**
 * [일회용] 국내 일별 시세 전체 적재 확인. 운영 서버는 Swagger가 막혀 있어 배치 이력 페이지에서 한 번 실행한다.
 * 백엔드에서 POST /admin/domestic-daily-prices/import를 지우면 이 다이얼로그와 버튼도 지운다
 */
export function DomesticPriceImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const notify = useNotify();
  const importPrices = useImportDomesticDailyPrices();

  const close = () => {
    if (importPrices.isPending) return;
    importPrices.reset();
    onClose();
  };

  const submit = () => {
    importPrices.mutate(undefined, {
      onSuccess: ({ from, to }) => {
        notify(
          `국내 일별 시세 전체 적재를 시작했습니다 (${formatDate(from)} ~ ${formatDate(to)}). 결과는 서버 로그에서 확인하세요.`,
        );
        importPrices.reset();
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>국내 시세 전체 적재 (일회용)</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            data.go.kr에서 국내 주식·ETF 일별 시세를 2020-01-01부터 오늘까지 전부 받아 저장합니다.
            서버에서 백그라운드로 실행되며 오래 걸립니다.
          </DialogContentText>
          <Alert severity="info">
            진행 상황과 결과는 서버 로그에만 남고 배치 이력에는 표시되지 않습니다. 이미 실행 중이면
            다시 시작되지 않습니다.
          </Alert>
          {importPrices.error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {importPrices.error.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close} color="inherit" disabled={importPrices.isPending}>
          취소
        </Button>
        <Button variant="contained" onClick={submit} loading={importPrices.isPending}>
          적재 시작
        </Button>
      </DialogActions>
    </Dialog>
  );
}
