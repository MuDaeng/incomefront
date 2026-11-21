import { Alert, AlertTitle, Box, Button, Stack } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 이 값이 바뀌면(예: 페이지 이동) 오류 상태를 지우고 다시 그린다 */
  resetKey?: string;
  /** 'page': 페이지 영역만 대신 보여준다. 'app': 앱 전체가 그려지지 않을 때 (새로고침만 제공) */
  variant?: 'page' | 'app';
}

interface State {
  error: Error | null;
  resetKey?: string;
}

/**
 * 렌더링 중 예외가 나면 흰 화면 대신 안내를 보여준다.
 * (이벤트 핸들러·비동기 오류는 잡지 않는다. 조회 오류는 각 페이지가 ErrorAlert로 보여준다)
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // 페이지를 옮기면 이전 페이지의 오류는 지운다
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('화면 렌더링 오류', error, info.componentStack);
  }

  private retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const isApp = this.props.variant === 'app';
    return (
      <Box sx={{ p: isApp ? 3 : 0, maxWidth: 720, mx: isApp ? 'auto' : undefined, mt: isApp ? 8 : 0 }}>
        <Alert
          severity="error"
          action={
            <Stack direction="row" spacing={1}>
              {!isApp && (
                <Button color="inherit" size="small" onClick={this.retry}>
                  다시 시도
                </Button>
              )}
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                새로고침
              </Button>
            </Stack>
          }
        >
          <AlertTitle>화면을 표시하는 중 문제가 생겼어요</AlertTitle>
          {isApp
            ? '새로고침해 주세요. 계속되면 잠시 후 다시 접속해 주세요.'
            : '다시 시도하거나 다른 메뉴로 이동해 보세요. 계속되면 새로고침해 주세요.'}
        </Alert>
      </Box>
    );
  }
}
