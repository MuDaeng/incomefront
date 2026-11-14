# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Frontend for the **income** dividend-portfolio API (NestJS backend: https://github.com/MuDaeng/income). Create React App + TypeScript, MUI 9 (`@mui/material`, `@mui/x-charts`, `@mui/x-date-pickers`), TanStack Query 5, React Router 7, dayjs. UI text is Korean.

## Working rules (always apply)

- **Reply in Korean** — progress updates, questions, final reports. Code identifiers and technical terms stay as-is.
- **Git branch strategy.** The default branch is `main`. Commit only when asked.
  - "커밋해줘" → create a short-lived branch off `main` (`feature/<topic>`, `fix/<topic>`, or `docs/<topic>`) and commit there. Never commit directly on `main`, even if the request says "커밋하고 main에 푸시해줘": commit on a branch first, then merge.
  - "머지하고 push하고 브랜치 삭제해줘" (or a request to push to `main`) → `git merge --ff-only <branch>` into `main`, `git push origin main`, then delete the branch locally (`git branch -d`) and on the remote if it was pushed. If `main` has moved and fast-forward fails, stop and ask instead of creating a merge commit.
  - After committing, offer the merge/push/delete step; don't run it unasked.
  - `.env.production` is committed (it holds only the public `REACT_APP_API_URL`; never put secrets in it — `REACT_APP_*` values are bundled into the client anyway). Never commit `.env.local` / `.env.*.local` or `claude-output.md` (gitignored). IDE files (`.idea/`) stay out of commits.
- **Conversation log: `claude-output.md`** at the repo root (gitignored, never committed). The user's terminal has no scrollback, so they read the conversation in this file in WebStorm.
  - After **every** turn, append the user's message **verbatim** as a `>` quote under `## 사용자`, then the reply exactly as printed in the terminal under `## Claude`. Newest at the bottom.
  - Clarifying questions and answers go under `## Claude (질문)` / `## 사용자 (답변)`. Short replies are logged too.
  - **Leave out git turns entirely**: commit, push, merge, branch-delete and PR requests and their replies are not logged — neither the request nor the result.
  - Group each session's turns under `# 대화 기록: <topics> (<YYYY-MM-DD>)`, separated from the previous session by `---`.
  - Still print the reply in the terminal as usual.

## Commands

- `npm start` — dev server on http://localhost:3000. Backend is expected at `REACT_APP_API_URL` (default `http://localhost:8080`, set locally in the gitignored `.env.local`; there is no `.env`). If port 3000 is already taken (the user often has a dev server running), don't kill that process — start another instance with `PORT=3001`, keeping in mind that Google login only redirects back to the backend's `FRONTEND_URL` (normally 3000).
- `npm run build` — production build. CRA loads `.env.production` (`REACT_APP_API_URL=https://api.mudaeng.online`); Vercel runs this script as-is. Locally `.env.local` takes precedence over `.env.production`, so a local build points at `localhost:8080` unless `.env.local` is moved aside. ESLint (`react-app` config) runs here and **fails the build** on errors (e.g. `import/first`), so run it before committing.
- `npx tsc --noEmit -p .` — type-check only (faster than a build). Covers `src/` and `test/`.
- `CI=true npm test -- --watchAll=false` — run tests once. Single file: append its path (e.g. `test/lib/format.test.ts`); single test: append `-t "<name>"`.
  - **Test files never sit next to source.** Tests live in `test/` beside `src/`, mirroring the `src/` path: `src/lib/format.ts` → `test/lib/format.test.ts`. Import the code under test relatively through `src` (e.g. `../../src/lib/format`). The `test` script passes `--roots src test` and `package.json` `jest.testMatch` only matches `test/**`, so a `*.test.ts` placed under `src/` will **not** run. `src/setupTests.ts` stays where CRA expects it.

## Toolchain constraints

- TypeScript is **5.9** although react-scripts 5 declares a peer range of `^4`. MUI 9 type definitions use TS 5 syntax and do not parse under 4.x — do not downgrade. `.npmrc` sets `legacy-peer-deps=true` so `npm install` works.
- MUI 9 removed deprecated props: use `slotProps` (`slotProps.input`, `slotProps.htmlInput`, `slotProps.textField`, `slotProps.transition`, `slotProps.primary: { sx }`) instead of `InputProps` / `TransitionProps` / `primaryTypographyProps`. `Grid` uses `size={{ xs, md }}`.

## Architecture

Folder roles: `src/api/` (backend calls), `src/auth/`, `src/components/` (shared UI and dialogs), `src/pages/` (one file per route), `src/lib/` (pure helpers).

- **Pages and components never call `fetch` or `request` directly.** Every backend call goes through a hook in `src/api/queries.ts`; add a new endpoint there (hook + `queryKeys` entry + response type in `types.ts`).
- **Mutations invalidate through the shared key prefix**, not by refetching individual queries from components.
- **Pure logic (formatting, validation, date math) goes in `src/lib/`** so it can be unit-tested from `test/lib/`.

**API layer (`src/api/`)**
- `client.ts` — the only `fetch` wrapper. The access token lives in memory only; the refresh token is an httpOnly cookie (`path=/auth`) set by the backend, so every request uses `credentials: 'include'`. On a 401 it calls `/auth/reissue` once and retries. `/auth/access` and `/auth/reissue` share a single in-flight promise, because the backend rotates the refresh token on reissue — two concurrent reissues would make the second one 401 and log the user out. Nest error bodies (`message: string | string[] | issue[]`) are normalized into `ApiError.message`.
- `types.ts` mirrors the backend DTOs. **All amounts, quantities and rates are decimal strings** (KRW integers, USD 6 decimals, rates in % with 2 decimals). Convert with `toNumber` / the `format*` helpers in `src/lib/format.ts` only at display time.
- `queries.ts` — every React Query hook and the `queryKeys` factory. All balance-related keys share the `['balance']` prefix; the register and sell mutations invalidate that prefix so dashboard, purchases, dividends and returns refresh together.

**Auth flow (`src/auth/AuthProvider.tsx`)**
Google login is a full-page redirect to `${API_URL}/auth/google`. The backend redirects back to `/auth/callback` (`AuthCallbackPage`), which calls `completeLogin` → `/auth/access` → `/auth/me`. On normal app load the provider tries the same silent login, except on the callback path. The backend has no logout endpoint and the cookie survives, so logout sets the `income.loggedOut` localStorage flag to suppress auto-login until the next explicit login.

**Routing / layout**
`App.tsx` wires the providers (Theme → date-picker Localization → QueryClient → Notifier → Router → Auth). Protected routes sit under `RequireAuth` → `Layout`. `Layout` owns the global "매수 등록" dialog and exposes it to pages through outlet context (`useLayout().openRegister(security?)`). `useNotify()` shows snackbars.

**Shared conventions**
- `DateRangeBar` holds the period presets (`PRESETS` in `DateRangeBar.tsx`). Each page picks its own preset list, ordered from shortest to longest period. Dates travel as `'YYYY-MM-DD'` strings, which also compare correctly as strings.
- Korean market colors: gains are red (`RISE_COLOR`), losses are blue (`FALL_COLOR`). Use `ProfitText` / `profitColor`, not MUI `success` / `error`.
- Client-side validation mirrors the backend Zod schemas: positive decimal strings (`isPositiveDecimal`), and sale date ≥ purchase date. A purchase date with no daily price is rejected by the backend, so the register dialog checks `/daily-securities` for that date first.
- Chart colors come from `src/lib/chart.ts` (`KRW_COLOR` for domestic, `USD_COLOR` for US).
- The security detail price chart is a hand-drawn candlestick (`CandleChart`): MUI X Charts community has no OHLC series, so it renders on `ChartsContainer` with a band x-axis and a hidden `line` series (needed for the axis tooltip). Candles use `RISE_COLOR` / `FALL_COLOR`; daily→weekly aggregation lives in `src/lib/candles.ts`.

## Backend contract notes

- The backend's CORS origin is its `FRONTEND_URL` env var. It must be `http://localhost:3000` for local login and cookies to work.
- `/balance/returns` requires both `from` and `to`. `/balance/dividends` accepts either or neither; omitting `to` includes upcoming payments.
- Selling a purchase lot is identified by `(securityId, purchaseDate, sequence)`, taken from `/balance/purchases`.
- `POST /balance` takes an optional `exchangeRate` (KRW per USD; ignored for KRW). Omitted → the backend stores the purchase-date USD rate. There is no GET endpoint for exchange rates, so the register dialog leaves the field empty instead of pre-filling it. `/balance/purchases` returns the stored rate with `exchangeRateDate: null`, or the fallback rate with its date; its `price` is already cut to 2 decimals (`ROUND_DOWN`).
- `PATCH /balance/purchases` (body `{ securityId, purchaseDate, sequence, exchangeRate }`) changes one lot's stored purchase exchange rate, sold lots too (`useUpdateExchangeRate`, `EditExchangeRateDialog` on the detail page). `exchangeRate: null` clears it so queries fall back to the purchase-date rate; the key is required (omitting it is 400) and KRW securities are 400.
- **Rate limiting (429)**: per IP per minute, 100 requests by default, 10 for `/auth/google`, `/auth/google/callback`, `/auth/access`, `/auth/reissue`, 30 for `GET /daily-securities`. `apiErrorMessage` (`src/lib/apiError.ts`) turns any 429 into a Korean "try again in a minute" message (Nest's body says "ThrottlerException: Too Many Requests"). A 429 from `/auth/reissue` must not log the user out (`request()` rethrows it); a 429 on silent login sets `autoLoginError`, shown on the login page. The register dialog debounces the purchase-date price lookup for the same reason. Query retries already skip 4xx.
- The backend has no bulk import (data collection) endpoints anymore (`/daily-securities/import*`, `/exchange-rates/import` were removed; collection is batch-only) — don't add UI for them.
- The backend keeps one refresh-token session per login/device, so logging in elsewhere doesn't log this browser out. Reissue still rotates that session's refresh token, so the single in-flight `/auth/access`·`/auth/reissue` promise in `client.ts` stays necessary.
- `DELETE /balance/purchases?securityId&purchaseDate&sequence` (204) deletes one mis-registered lot, sold ones too (`useDeletePurchase`). When it was the security's last lot the backend also drops it from the holdings, so the detail page navigates back to `/`. Remaining lots keep their sequences.
