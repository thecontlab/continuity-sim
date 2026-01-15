import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // JSON.stringify is crucial here to ensure it's inserted as a string literal
      // We only expose API_KEY, not the entire 'env' object, for security.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    }
  };
});