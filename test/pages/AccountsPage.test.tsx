import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { AccountsPage } from '../../src/pages/AccountsPage';
import { accountList } from '../fixtures';
import { apiError, mockApi, renderPage, requestCalls, selectOption } from '../testUtils';

vi.mock('../../src/api/client', async (importOriginal) => ({ ...(await importOriginal<object>()), request: vi.fn() }));

const setup = (extra: Record<string, unknown> = {}) => {
  mockApi({
    'GET /accounts': accountList(),
    'PATCH /accounts/1/type': { id: 1, securityCompany: 'TOSS', accountType: 'ISA' },
    'POST /accounts': ({ body }: { body?: unknown }) => ({ id: 3, ...(body as object) }),
    ...extra,
  });
  renderPage(<AccountsPage />, { route: '/accounts' });
};

describe('AccountsPage', () => {
  it('계좌 목록을 증권사·타입 이름으로 보여준다', async () => {
    setup();
    expect(await screen.findByText('토스')).toBeInTheDocument();
    expect(screen.getByText('키움 ISA')).toBeInTheDocument();
  });

  it('계좌 타입을 바꾸면 그 계좌의 타입 변경을 요청한다', async () => {
    setup();
    const row = (await screen.findByText('토스')).closest('tr') as HTMLElement;
    fireEvent.mouseDown(within(row).getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'ISA' }));

    await waitFor(() => expect(requestCalls('PATCH', '/accounts/1/type')).toHaveLength(1));
    expect(requestCalls('PATCH', '/accounts/1/type')[0].body).toEqual({ accountType: 'ISA' });
  });

  it('계좌 추가는 고른 증권사·타입으로 생성을 요청한다', async () => {
    setup();
    await screen.findByText('토스');
    fireEvent.click(screen.getByRole('button', { name: '계좌 추가' }));
    const dialog = await screen.findByRole('dialog');

    const company = within(dialog).getByRole('combobox', { name: /증권사/ });
    fireEvent.change(company, { target: { value: '삼성' } });
    fireEvent.click(await screen.findByRole('option', { name: '삼성증권' }));
    selectOption('계좌 타입', '연금저축');
    fireEvent.click(within(dialog).getByRole('button', { name: '추가' }));

    await waitFor(() => expect(requestCalls('POST', '/accounts')).toHaveLength(1));
    expect(requestCalls('POST', '/accounts')[0].body).toEqual({ securityCompany: 'SAMSUNG', accountType: 'PS' });
  });

  it('매수 내역이 남은 계좌를 삭제하면 서버 메시지를 보여준다', async () => {
    setup({ 'DELETE /accounts/2': apiError(400, '매수 내역이 남아 있는 계좌는 삭제할 수 없습니다.') });
    const row = (await screen.findByText('키움 ISA')).closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: '계좌 삭제' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await within(dialog).findByText('매수 내역이 남아 있는 계좌는 삭제할 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument(); // 창은 닫히지 않는다
  });
});
