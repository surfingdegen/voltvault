interface Window {
  ethereum?: any;
  fs?: {
    readFile: (path: string, options?: { encoding?: string }) => Promise<any>;
  };
}
