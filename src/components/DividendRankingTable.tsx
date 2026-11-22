import {
  Box,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { securityDetailPath } from '../lib/account';
import type { DividendRankItem } from '../lib/dividendRanking';
import { formatKrw, formatMoney } from '../lib/format';
import { CurrencyChip } from './SecuritySearch';

/** 기간 안에 지급받은 배당금의 종목별 순위 표 (원화 환산 합 순) */
export function DividendRankingTable({ items, accountId }: { items: DividendRankItem[]; accountId?: number }) {
  const navigate = useNavigate();
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ width: 56 }}>
              순위
            </TableCell>
            <TableCell>종목</TableCell>
            <TableCell align="right">지급 횟수</TableCell>
            <TableCell align="right">배당금</TableCell>
            <TableCell align="right">원화 환산</TableCell>
            <TableCell sx={{ width: 180 }}>비중</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow
              key={item.securityId}
              hover
              onClick={() => navigate(securityDetailPath(item.securityId, accountId))}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell align="center">
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {idx + 1}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CurrencyChip currency={item.currency} />
                  <Typography variant="body2" noWrap sx={{ maxWidth: 220, fontWeight: 600 }}>
                    {item.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">{item.count}회</TableCell>
              <TableCell align="right">{formatMoney(item.amount, item.currency)}</TableCell>
              <TableCell align="right">{formatKrw(item.krwAmount)}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, item.share)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right' }}>
                    {item.share.toFixed(2)}%
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
