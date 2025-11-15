/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRAYER_TIMES_SERVICE_URL: string;
  readonly VITE_TRANSLATION_SERVICE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
