# incomefront

[income](https://github.com/MuDaeng/income) 배당 포트폴리오 API의 프론트엔드입니다. 국내(KRW)·미국(USD) 종목의 매수·매도 내역을 계좌별로 관리하고, 평가손익·기간 수익률·배당금을 확인합니다.

## 주요 화면

| 화면 | 경로 | 내용 |
| --- | --- | --- |
| 통합잔고 | `/` | 보유 종목, 평가금액·손익, 계좌별 보유 수량, 예상 연배당 |
| 종목 상세 | `/securities/:securityId` | 캔들 차트, 매수 lot 목록(매도·일괄매도·삭제·환율 수정·계좌 이동), 주당 배당 이력과 배당 지표, 배당으로 원금 회복 기간 |
| 배당금 | `/dividends` | 기간별 배당 요약(세전·세후)과 탭: 월별 내역(지급 예정 포함) · 배당금 순위 · 배당 지표 |
| 기간 수익률 | `/returns` | 기간 시작 시점 기준금액 대비 수익률, 월별 추이 |
| 계좌 관리 | `/accounts` | 증권사 계좌 추가·유형 변경·삭제 |
| 일괄등록 | `/toss-import` | 토스증권 거래내역(JSON)으로 한 계좌를 다시 구성, 주식 대여 출고 확인 |
| 관리자 | `/admin` | 배치 이력 · 시세 조회 이력 · 토큰 갱신 이력 (관리자 토큰일 때만 메뉴 표시) |

- 로그인은 Google 계정으로 하며, 모든 잔고 화면은 `?accountId=`로 계좌를 골라 볼 수 있습니다.
- 한국 시장 관례대로 상승은 빨강, 하락은 파랑으로 표시합니다.

## 기술 스택

Vite 8 · React 19 · TypeScript 5.9 · MUI 9 (`@mui/material`, `@mui/x-charts`, `@mui/x-date-pickers`) · TanStack Query 5 · React Router 7 · dayjs · Vitest 5 · ESLint 9

## 시작하기

Node 22 기준입니다.

```bash
npm ci
echo "VITE_API_URL=http://localhost:8080" > .env.local   # 로컬 백엔드 주소
npm start                                                # http://localhost:3000
```

로컬 로그인·쿠키가 동작하려면 백엔드의 `FRONTEND_URL`이 `http://localhost:3000`이어야 합니다.

## 환경 변수

Vite 규칙대로 `VITE_` 접두사가 붙은 변수만 클라이언트에 노출되며, 코드에서는 `import.meta.env.VITE_*`로 읽습니다 (타입은 `src/vite-env.d.ts`).

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `VITE_API_URL` | 백엔드 API 주소 | `http://localhost:8080` |

| 파일 | 커밋 | 쓰이는 때 |
| --- | --- | --- |
| `.env.production` | O | `npm run build`, Vercel 배포 (`https://api.mudaeng.online`) |
| `.env.local` | X | `npm start` (로컬 백엔드 주소) |
| `.env.production.local` | X | 로컬 빌드에서 운영 주소 대신 다른 주소를 쓸 때 |

- `VITE_*` 값은 빌드 결과물에 그대로 들어가므로 비밀값을 넣지 마세요.
- Vite에서는 `.env.production`이 `.env.local`보다 우선합니다. 그래서 로컬에서 `npm run build`를 해도 운영 API를 가리킵니다.
- CRA 시절 이름인 `REACT_APP_API_URL`은 더 이상 읽지 않습니다. Vercel 프로젝트 환경 변수로 주소를 지정하려면 `VITE_API_URL`을 쓰세요 (`.env.production`보다 우선).
- `.env` 파일을 바꾼 뒤에는 개발 서버를 재시작해야 반영됩니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm start` | 개발 서버 (포트 3000 고정, 사용 중이면 `npm start -- --port 3001`) |
| `npm run build` | 타입 체크 후 `build/`에 프로덕션 빌드 |
| `npm run preview` | 빌드 결과를 로컬에서 띄우기 |
| `npm run lint` | ESLint (`--max-warnings 0`, 경고도 실패) |
| `npx tsc --noEmit -p .` | 타입 체크만 |
| `npm test` / `npx vitest run` | Vitest watch 모드 / 한 번 실행 |

## 폴더 구조

```
src/
  api/         백엔드 호출 (client.ts: fetch·토큰 재발급, queries.ts: React Query 훅, types.ts: DTO)
  auth/        Google 로그인·자동 로그인 (AuthProvider)
  components/  공용 UI와 다이얼로그
  pages/       라우트별 페이지
  lib/         순수 로직 (포맷, 계산, 검증, URL 쿼리 훅)
test/          src/ 경로를 그대로 따르는 테스트 (lib 단위 테스트, pages 페이지 테스트)
```

- 페이지·컴포넌트는 `fetch`를 직접 호출하지 않고 `src/api/queries.ts`의 훅만 씁니다.
- 금액·수량·비율은 API에서 문자열(decimal)로 받고, 화면에 표시할 때만 숫자로 변환합니다.
- 액세스 토큰은 메모리에만 두고, 리프레시 토큰은 백엔드가 설정한 httpOnly 쿠키를 사용합니다.

## 테스트

- 테스트는 `src/` 옆이 아니라 `test/`에 둡니다 (`src/lib/format.ts` → `test/lib/format.test.ts`).
- 페이지 테스트는 실제 페이지와 쿼리 훅을 렌더링하고 `request`만 목으로 바꿉니다 (`test/testUtils.tsx`의 `mockApi`, `renderPage`).
- 차트(`@mui/x-charts`)는 jsdom에서 그릴 수 없어 스텁으로 대체됩니다.

## CI · 배포

- GitHub Actions(`.github/workflows/ci.yml`)가 `master` push와 PR마다 타입 체크 · lint · 테스트 · 빌드를 실행합니다.
- Vercel로 배포합니다 (`vercel.json`: Vite 빌드, `build/` 출력, SPA rewrite, CSP 등 보안 헤더). 외부 스크립트·폰트·API 출처를 추가하면 CSP도 함께 수정해야 합니다.
