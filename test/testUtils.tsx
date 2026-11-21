/**
 * 페이지 테스트 공용 도구.
 * - mockApi: src/api/client의 request만 가짜로 바꿔 라우트 표의 응답을 돌려준다
 *   (테스트 파일 맨 위에서 request를 jest.fn으로 바꿔 둔다:
 *   jest.mock('../../src/api/client', () => ({ ...jest.requireActual('../../src/api/client'), request: jest.fn() }));)
 * - renderPage: 앱과 같은 Provider로 감싸 페이지를 그린다
 */
import { ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import 'dayjs/locale/ko';
import type { ReactElement } from 'react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { ApiError, request } from '../src/api/client';
import { NotifierProvider } from '../src/components/Notifier';
import { theme } from '../src/theme';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
interface RequestOptions {
  method?: Method;
  query?: Record<string, unknown>;
  body?: unknown;
}

/** 응답 값, 요청을 받아 응답을 만드는 함수, 또는 던질 ApiError */
type RouteHandler = unknown | ((options: RequestOptions) => unknown);
export type ApiRoutes = Record<string, RouteHandler>;

const requestMock = () => request as unknown as jest.Mock;

/** "METHOD path" 라우트 표로 request 응답을 정한다. 표에 없는 요청은 실패시킨다 */
export function mockApi(routes: ApiRoutes) {
  requestMock().mockImplementation(async (path: string, options: RequestOptions = {}) => {
    const key = `${options.method ?? 'GET'} ${path}`;
    if (!(key in routes)) throw new Error(`mockApi: 정의되지 않은 요청 ${key}`);
    const handler = routes[key];
    const result = typeof handler === 'function' ? (handler as (o: RequestOptions) => unknown)(options) : handler;
    if (result instanceof ApiError) throw result;
    return result;
  });
}

/** 지금까지 받은 요청 중 method·path가 맞는 것들의 옵션 */
export function requestCalls(method: Method, path: string): RequestOptions[] {
  return requestMock()
    .mock.calls.filter(([p, o]) => p === path && ((o as RequestOptions | undefined)?.method ?? 'GET') === method)
    .map(([, o]) => (o ?? {}) as RequestOptions);
}

export const apiError = (status: number, message: string) => new ApiError(status, message);

/**
 * 앱과 같은 Provider로 감싸 페이지를 그린다.
 * route: 시작 URL(쿼리 포함), path: 라우트 패턴(:securityId 등), outletContext: useLayout() 값
 */
export function renderPage(
  ui: ReactElement,
  {
    route = '/',
    path = '*',
    outletContext = { openRegister: jest.fn() },
  }: { route?: string; path?: string; outletContext?: unknown } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
        <QueryClientProvider client={queryClient}>
          <NotifierProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route element={<Outlet context={outletContext} />}>
                  <Route path={path} element={ui} />
                </Route>
              </Routes>
            </MemoryRouter>
          </NotifierProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>,
  );
}

/** MUI select(TextField select)에서 옵션을 고른다. 옵션이 비동기로 채워지면 열고 findByRole('option')로 기다린다 */
export function selectOption(label: string, option: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

