import { defineConfig } from 'vite';

// es2022: the map pipeline uses top-level await (initTerrain before bootstrap).
// base: GitHub Pages serves a project at /<repo>/, not at the root. Vite
// rewrites its own bundled asset URLs for this, but NOT strings the game
// builds at runtime — see asset() in defs.ts, which every map, texture and
// font path now goes through. Without both halves the page loads and then
// shows an empty field, which is the worst kind of deploy bug: it looks like
// the game, and none of the art is there.
// Override with SWARM_BASE for other hosts (Netlify, itch) where base is '/'.
export default defineConfig({
  base: process.env.SWARM_BASE ?? '/',
  build: { target: 'es2022' },
});
