/// <reference types="vite/client" />

interface Window {
  ethereum?: any;
  fs?: {
    readFile: (path: string, options?: { encoding?: string }) => Promise<any>;
  };
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_VOLTC_TOKEN_ADDRESS: string;
  readonly VITE_ZORA_CHAIN_ID: string;
  readonly VITE_REQUIRED_BALANCE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
