import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../../src/pages/AdminLayout';

// App.tsx와 같은 admin 하위 라우트 구성. 각 화면은 stub으로 바꿔 탭 전환만 본다
const renderAdmin = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="batches" replace />} />
          <Route path="batches" element={<p>배치 화면</p>} />
          <Route path="price-searches" element={<p>시세 화면</p>} />
          <Route path="client-tokens" element={<p>토큰 화면</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('AdminLayout', () => {
  it('/admin은 배치 이력 탭으로 이동한다', () => {
    renderAdmin('/admin');

    expect(screen.getByText('배치 화면')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '배치 이력' })).toHaveAttribute('aria-selected', 'true');
  });

  it('경로에 맞는 탭이 선택된다', () => {
    renderAdmin('/admin/client-tokens');

    expect(screen.getByText('토큰 화면')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '토큰 갱신 이력' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '배치 이력' })).toHaveAttribute('aria-selected', 'false');
  });

  it('탭을 누르면 그 화면으로 바뀐다', () => {
    renderAdmin('/admin/batches');

    fireEvent.click(screen.getByRole('tab', { name: '시세 조회 이력' }));

    expect(screen.getByText('시세 화면')).toBeInTheDocument();
    expect(screen.queryByText('배치 화면')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '시세 조회 이력' })).toHaveAttribute('aria-selected', 'true');
  });
});
