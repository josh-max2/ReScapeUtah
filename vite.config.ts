import { defineConfig } from 'vite';

// es2022: the map pipeline uses top-level await (initTerrain before bootstrap).
export default defineConfig({
  build: { target: 'es2022' },
});
