import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000
    },
    define: {
      // Explicitly expose API_KEY to the client-side code
      // This allows 'process.env.API_KEY' to work even if it doesn't have VITE_ prefix
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});