import type { MockInstance } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

let shouldThrow = true;
function Boom() {
  if (shouldThrow) throw new Error('boom');
  return <p>정상 화면</p>;
}

describe('ErrorBoundary', () => {
  let consoleError: MockInstance<typeof console.error>;
  beforeEach(() => {
    shouldThrow = true;
    // React와 componentDidCatch가 남기는 오류 로그는 테스트 출력에서 숨긴다
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('렌더링 오류가 나면 안내를 보여주고, 다시 시도로 복구한다', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('화면을 표시하는 중 문제가 생겼어요')).toBeInTheDocument();
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(screen.getByText('정상 화면')).toBeInTheDocument();
  });

  it('resetKey가 바뀌면(페이지 이동) 오류를 지운다', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/dividends">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('화면을 표시하는 중 문제가 생겼어요')).toBeInTheDocument();
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetKey="/returns">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('정상 화면')).toBeInTheDocument();
  });

  it('앱 전체용은 새로고침만 제공한다', () => {
    render(
      <ErrorBoundary variant="app">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull();
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
  });
});
