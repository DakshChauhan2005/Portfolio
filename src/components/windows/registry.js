import { lazy } from 'react'
import { asset } from '../../utils/asset'

/**
 * Wrap a dynamic import so the same module can be rendered lazily *and*
 * prefetched by hand. `load` memoises the promise, so hovering a dock icon and
 * then clicking it does one network request, not two.
 */
const chunk = (loader) => {
    let promise
    const load = () => (promise ??= loader())
    return {
        component: lazy(load),
        // Prefetching is best-effort, so swallow the rejection: an offline
        // visitor or a stale chunk hash would otherwise produce an unhandled
        // rejection from a request nobody asked for. React.lazy attaches its
        // own handler when the window is actually rendered, and the error
        // boundary around it turns a real failure into a visible message.
        preload: () => { load().catch(() => { }) },
    }
}

/**
 * Every window on the desktop, declared once.
 *
 * `id` is the key used everywhere — by the manager, the dock, and the terminal's
 * `open <id>` command. Adding a window means adding an entry here and nothing
 * else: App renders from this list and Dock builds its icons from it.
 *
 *   id          string    unique key
 *   title       string    shown in the title bar and dock tooltip
 *   icon        string    path under public/doc-icons/, via `asset()`
 *   dockClass   string    class supplying the icon's background in dock.scss
 *   component   Component window *content* only — the frame comes from MacWindow
 *   preload     fn        warms this window's chunk; see `chunk` above
 *   defaultSize {width,height} in px; clamped to the desktop on first open
 *
 * Every window is its own chunk. Nothing but the desktop shell is in the entry
 * bundle — the terminal emulator, the syntax highlighter, the PDF object and
 * the Spotify iframe all arrive only when their window is opened (or when the
 * idle prefetch in `App` gets to them first).
 *
 * Spawn position is not declared: the manager cascades windows from the top
 * left and clamps to the viewport, so a window can never open off-screen.
 */
export const registry = [
    {
        id: 'github',
        title: 'Projects',
        icon: asset('/doc-icons/github.svg'),
        dockClass: 'github',
        ...chunk(() => import('./Github')),
        defaultSize: { width: 880, height: 560 },
    },
    {
        id: 'notes',
        title: 'Skills',
        icon: asset('/doc-icons/note.svg'),
        dockClass: 'note',
        ...chunk(() => import('./Notes')),
        defaultSize: { width: 520, height: 460 },
    },
    {
        id: 'resume',
        title: 'Resume',
        icon: asset('/doc-icons/pdf.svg'),
        dockClass: 'pdf',
        ...chunk(() => import('./Resume')),
        defaultSize: { width: 720, height: 560 },
    },
    {
        id: 'spotify',
        title: 'Music',
        icon: asset('/doc-icons/spotify.svg'),
        dockClass: 'spotify',
        ...chunk(() => import('./Spotify')),
        defaultSize: { width: 380, height: 480 },
    },
    {
        id: 'cli',
        title: 'Terminal',
        icon: asset('/doc-icons/cli.svg'),
        dockClass: 'cli',
        ...chunk(() => import('./Cli')),
        defaultSize: { width: 640, height: 480 },
    },
]

export const windowIds = registry.map(w => w.id)

/** Warm every window chunk. Called from an idle callback after first paint. */
export const preloadAll = () => registry.forEach(def => def.preload())

export default registry
