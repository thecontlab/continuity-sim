import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  // Inject the provided API Key directly into the environment object
  env.API_KEY = "AIzaSyAF_iT7w7rBEh0sRu0wJo7_7CFyUp2s2X0";

  return {
    plugins: [react()],
    define: {
      // This ensures your code using process.env.API_KEY works in the browser
      'process.env': env
    }
  };
});