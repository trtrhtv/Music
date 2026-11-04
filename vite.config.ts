/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works from any sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true },
  // The mic simulations run seconds of audio through the analysis; on a busy machine 5 s isn't enough.
  test: { testTimeout: 30000 },
});
