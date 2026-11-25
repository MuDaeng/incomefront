import { screen } from '@testing-library/react';
import { formatDateTime } from '../../src/lib/format';
import { AdminClientTokenPage } from '../../src/pages/AdminClientTokenPage';
import { apiError, mockApi, renderPage } from '../testUtils';

vi.mock('../../src/api/client', async (importOriginal) => ({ ...(await importOriginal<object>()), request: vi.fn() }));

const render = () =>
  renderPage(<AdminClientTokenPage />, { route: '/admin/client-tokens', path: '/admin/client-tokens' });

describe('AdminClientTokenPage', () => {
  it('외부 API 이름과 마지막 갱신 시각을 응답 순서대로 보여 준다', async () => {
    mockApi({
      'GET /admin/client-tokens': [
        { clientType: 'KIS', updatedAt: '2026-11-25T23:10:00.000Z' },
        { clientType: 'TOSS', updatedAt: '2026-11-20T01:00:00.000Z' },
      ],
    });
    render();

    expect(await screen.findByText('한국투자증권(KIS)')).toBeInTheDocument();
    expect(screen.getByText('토스')).toBeInTheDocument();
    expect(screen.getByText(formatDateTime('2026-11-25T23:10:00.000Z'))).toBeInTheDocument();
    expect(screen.getByText(formatDateTime('2026-11-20T01:00:00.000Z'))).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('한국투자증권(KIS)');
    expect(rows[2]).toHaveTextContent('토스');
  });

  it('토큰이 없으면 빈 상태', async () => {
    mockApi({ 'GET /admin/client-tokens': [] });
    render();

    expect(await screen.findByText('저장된 토큰이 없습니다.')).toBeInTheDocument();
  });

  it('관리자가 아니면(403) 오류를 보여 준다', async () => {
    mockApi({ 'GET /admin/client-tokens': apiError(403, '관리자만 사용할 수 있습니다.') });
    render();

    expect(await screen.findByText(/관리자만 사용할 수 있습니다/)).toBeInTheDocument();
  });
});
