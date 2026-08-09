import { useSyncExternalStore } from 'react'

/**
 * Below this width the desktop metaphor is abandoned: windows go full-screen,
 * one at a time, and the dock becomes a bottom tab bar.
 *
 * The same number is hardcoded in `app.scss`, `dock.scss`, `nav.scss` and the
 * window stylesheets as `@media (max-width: 767px)` — SCSS can't read a JS
 * constant, so if you move this, move those too.
 */
export const MOBILE_BREAKPOINT = 768

const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

const subscribe = (onChange) => {
    const mql = window.matchMedia(QUERY)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches

/**
 * True while the viewport is narrower than the breakpoint.
 *
 * `useSyncExternalStore` rather than an effect: it reads the media query during
 * render, so the first paint is already correct and a resize re-renders only
 * when the answer actually changes — not on every pixel of a drag.
 */
export function useIsMobile() {
    return useSyncExternalStore(subscribe, getSnapshot)
}

export default useIsMobile
