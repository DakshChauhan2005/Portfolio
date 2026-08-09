import { useCallback, useMemo, useState } from 'react'

const BASE_Z = 10
const CASCADE_STEP = 28
// After this many windows the cascade starts over, so a long chain of opens
// can't march the last one into the bottom-right corner. Keep it above the
// number of windows in the registry (5) or two of them share a spawn point.
const CASCADE_WRAP = 6
const MIN_W = 320
const MIN_H = 200

// A window never takes more than this share of the desktop when it first
// opens: the wallpaper staying visible is what makes it read as a desktop.
const SPAWN_W_RATIO = 0.86
const SPAWN_H_RATIO = 0.82

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

const topZ = (windows) => Math.max(BASE_Z, ...Object.values(windows).map(w => w.z))

/**
 * A window's opening size along one axis: its preferred size, capped at a
 * share of the viewport, floored at the minimum — but never wider than the
 * desktop itself, so the floor can't push it off the edge on a small screen.
 */
const sizeFor = (want, available, ratio, min) =>
    Math.round(clamp(Math.min(want, available * ratio), Math.min(min, available), available))

/**
 * Where a window lands the first time it opens.
 *
 * Everything here is derived from the live desktop rect — no absolute pixels.
 * The old hardcoded coordinates (Spotify at x=1350) opened off-screen on
 * anything smaller than a large monitor, and with no bounds they were then
 * unrecoverable.
 */
const spawn = (def, rect, index) => {
    const width = sizeFor(def.defaultSize.width, rect.width, SPAWN_W_RATIO, MIN_W)
    const height = sizeFor(def.defaultSize.height, rect.height, SPAWN_H_RATIO, MIN_H)
    const step = index % CASCADE_WRAP
    return {
        width,
        height,
        x: clamp(Math.round(rect.width * 0.04) + step * CASCADE_STEP, 0, Math.max(0, rect.width - width)),
        y: clamp(Math.round(rect.height * 0.05) + step * CASCADE_STEP, 0, Math.max(0, rect.height - height)),
    }
}

const initialState = (registry) =>
    Object.fromEntries(registry.map(def => [def.id, {
        open: false,
        // Once true it stays true: the component keeps living in the tree while
        // closed so terminal history and scroll position survive. Lazy on first
        // open so the Spotify iframe and the PDF never load unless asked for.
        mounted: false,
        minimized: false,
        maximized: false,
        z: BASE_Z,
        geometry: null,
        restore: null,
        // False while the geometry is still whatever `spawn` chose. A resize
        // may re-derive that freely; once the visitor has dragged or resized
        // the window it becomes true and their size is never overridden.
        userSized: false,
    }]))

/**
 * Owns every window's open/minimised/maximised state, stacking order, and
 * geometry.
 *
 * `getDesktopRect` returns the bounds windows live in — the area between the
 * menu bar and the dock. It's a callback rather than a value because the rect
 * is only meaningful after layout, and it changes on resize.
 */
export function useWindowManager(registry, getDesktopRect) {
    const [windows, setWindows] = useState(() => initialState(registry))

    /**
     * The frontmost window a visitor can actually see. Two things need it: Esc
     * closes it, and the mobile layout shows only it.
     */
    const topmost = useMemo(() => {
        let best = null
        for (const [id, w] of Object.entries(windows)) {
            if (!w.open || w.minimized) continue
            if (!best || w.z > windows[best].z) best = id
        }
        return best
    }, [windows])

    const focus = useCallback((id) => {
        setWindows(prev => {
            const w = prev[id]
            if (!w || w.z === topZ(prev)) return prev
            return { ...prev, [id]: { ...w, z: topZ(prev) + 1 } }
        })
    }, [])

    const open = useCallback((id) => {
        setWindows(prev => {
            const w = prev[id]
            if (!w) return prev
            const index = registry.findIndex(d => d.id === id)
            const geometry = w.geometry ?? spawn(registry[index], getDesktopRect(), index)
            return {
                ...prev,
                [id]: { ...w, open: true, mounted: true, minimized: false, z: topZ(prev) + 1, geometry },
            }
        })
    }, [registry, getDesktopRect])

    const close = useCallback((id) => {
        // Geometry is deliberately kept, so reopening restores where it was.
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], open: false, minimized: false } }))
    }, [])

    const minimize = useCallback((id) => {
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], minimized: true } }))
    }, [])

    const toggleMaximize = useCallback((id) => {
        setWindows(prev => {
            const w = prev[id]
            if (!w) return prev
            if (w.maximized) {
                return { ...prev, [id]: { ...w, maximized: false, geometry: w.restore ?? w.geometry, restore: null } }
            }
            const rect = getDesktopRect()
            return {
                ...prev,
                [id]: {
                    ...w,
                    maximized: true,
                    restore: w.geometry,
                    geometry: { x: 0, y: 0, width: rect.width, height: rect.height },
                    z: topZ(prev) + 1,
                },
            }
        })
    }, [getDesktopRect])

    const setGeometry = useCallback((id, geometry) => {
        // Dragging or resizing a zoomed window drops it back to a normal one,
        // the way a real title bar behaves. `userSized` also latches here: from
        // now on a viewport change may only clamp this window, never re-spawn it.
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], geometry, maximized: false, restore: null, userSized: true } }))
    }, [])

    /**
     * Dock click. Mirrors macOS: launch, restore, raise, or hide — never close.
     * Closing is the red button's job and nothing else's.
     */
    const toggleFromDock = useCallback((id) => {
        setWindows(prev => {
            const w = prev[id]
            if (!w) return prev
            if (!w.open || w.minimized) {
                const index = registry.findIndex(d => d.id === id)
                const geometry = w.geometry ?? spawn(registry[index], getDesktopRect(), index)
                return { ...prev, [id]: { ...w, open: true, mounted: true, minimized: false, z: topZ(prev) + 1, geometry } }
            }
            if (w.z === topZ(prev)) return { ...prev, [id]: { ...w, minimized: true } }
            return { ...prev, [id]: { ...w, z: topZ(prev) + 1 } }
        })
    }, [registry, getDesktopRect])

    /**
     * Re-fit everything into the desktop after a viewport change: keeps a
     * maximised window maximised, and stops a window that was near the right or
     * bottom edge from ending up unreachable on a smaller screen.
     *
     * A window the visitor has never sized themselves is re-spawned rather than
     * merely clamped. Clamping only ever shrinks, so without this a window first
     * opened on a phone stayed 320px wide forever once the viewport grew —
     * which is exactly what happens crossing back over the mobile breakpoint.
     */
    const refit = useCallback(() => {
        const rect = getDesktopRect()
        setWindows(prev => {
            let changed = false
            const next = {}
            for (const [id, w] of Object.entries(prev)) {
                if (!w.geometry) { next[id] = w; continue }

                let fitted
                if (w.maximized) {
                    fitted = { x: 0, y: 0, width: rect.width, height: rect.height }
                } else if (!w.userSized) {
                    const index = registry.findIndex(d => d.id === id)
                    fitted = spawn(registry[index], rect, index)
                } else {
                    const width = Math.min(w.geometry.width, Math.max(MIN_W, rect.width))
                    const height = Math.min(w.geometry.height, Math.max(MIN_H, rect.height))
                    fitted = {
                        width,
                        height,
                        x: clamp(w.geometry.x, 0, Math.max(0, rect.width - width)),
                        y: clamp(w.geometry.y, 0, Math.max(0, rect.height - height)),
                    }
                }

                const same = fitted.x === w.geometry.x && fitted.y === w.geometry.y
                    && fitted.width === w.geometry.width && fitted.height === w.geometry.height
                if (same) { next[id] = w } else { changed = true; next[id] = { ...w, geometry: fitted } }
            }
            return changed ? next : prev
        })
    }, [registry, getDesktopRect])

    return { windows, topmost, open, close, focus, minimize, toggleMaximize, setGeometry, toggleFromDock, refit }
}

export default useWindowManager
