/**
 * Resolve a path in `public/` against the deploy base.
 *
 * Vite rewrites absolute asset URLs for you in index.html and in CSS `url()`,
 * but *not* inside JS string literals — a bare '/doc-icons/github.svg' stays
 * bare in the bundle and 404s the moment the site is served from anywhere but
 * the domain root. GitHub Pages serves this repo from /Portfolio/, so every
 * public-dir path referenced from JS goes through here.
 *
 * `import.meta.env.BASE_URL` is whatever `base` is set to in vite.config.js and
 * always ends in a slash, so the leading slash on the argument is stripped.
 */
const BASE = import.meta.env.BASE_URL

export const asset = path => `${BASE}${String(path).replace(/^\/+/, '')}`

export default asset
