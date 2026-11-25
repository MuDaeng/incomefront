import { Box, Tab, Tabs } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

/** 관리자 화면 탭. path는 /admin/ 아래 경로 (App.tsx의 admin 하위 라우트와 맞춘다) */
export const ADMIN_TABS = [
  { path: 'batches', label: '배치 이력' },
  { path: 'price-searches', label: '시세 조회 이력' },
  { path: 'client-tokens', label: '토큰 갱신 이력' },
] as const;

/** '/admin/price-searches/…' → 'price-searches'. 탭에 없는 경로면 false (선택 없음) */
const selectedTab = (pathname: string): string | false => {
  const segment = pathname.replace(/^\/admin\/?/, '').split('/')[0];
  return ADMIN_TABS.some((tab) => tab.path === segment) ? segment : false;
};

/**
 * 왼쪽 메뉴 "관리자" 화면. 위쪽 탭으로 관리자 화면을 고르고, 탭마다 URL(/admin/batches 등)이 따로 있다.
 * 각 화면은 Outlet에서 자기 PageHeader를 그린다
 */
export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab(pathname)} variant="scrollable" allowScrollButtonsMobile>
          {ADMIN_TABS.map((tab) => (
            <Tab key={tab.path} value={tab.path} label={tab.label} component={Link} to={`/admin/${tab.path}`} />
          ))}
        </Tabs>
      </Box>
      <Outlet />
    </>
  );
}
