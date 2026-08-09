import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * GitHub Pages serves this repo from https://<user>.github.io/Portfolio/, so a
 * production build has to be rooted at /Portfolio/ rather than /. Everything in
 * JS that points into public/ goes through `asset()` in src/utils/asset.js,
 * which reads this value back as import.meta.env.BASE_URL.
 *
 * Override it when the deploy target changes — no code edit needed:
 *   BASE_PATH=/            a <user>.github.io repo, or a custom domain
 *   BASE_PATH=/other-name/ if the repo is renamed
 * Leading and trailing slashes are both required.
 *
 * Dev stays at / so `npm run dev` keeps serving localhost:5173 plainly.
 * `isPreview` has to be tested separately: `vite preview` runs with
 * command === 'serve', so without it preview would serve at / the very files
 * that were built pointing at /Portfolio/, and 404 every asset.
 */
// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? (process.env.BASE_PATH || '/Portfolio/') : '/',
  plugins: [react()],
}))
