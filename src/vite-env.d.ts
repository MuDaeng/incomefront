/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 주소 (.env.production, 로컬은 .env.local) */
  readonly REACT_APP_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
