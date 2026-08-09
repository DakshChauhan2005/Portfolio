import { useCallback, useLayoutEffect, useRef } from 'react'
import { EASINGS } from '../data/windowAnimation'

// Samples per animation. The curves are baked into the keyframe values and the
// animation itself runs `linear`, which is the only way to give the genie's two
// axes different easings inside one transform. 30 is past the point where more
// steps are visible, even at 900ms.
const STEPS = 30

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

/**
 * One frame of the animation. `e` is *openness*: 0 is the window collapsed into
 * the dock, 1 is the window at rest. Both directions run through here — opening
 * walks e from 0 to 1, closing walks it back — so the two can never drift apart.
 */
const frameAt = (s, win, dock, e) => {
    const fade = clamp(s.startOpacity + (1 - s.startOpacity) * Math.min(1, e * s.fadeRate), 0, 1)
        .toFixed(3)

    if (s.effect === 'fade') {
        const scale = 0.98 + 0.02 * clamp(e, 0, 1)
        return { transform: `scale(${scale.toFixed(4)})`, transformOrigin: '50% 50%', opacity: fade }
    }

    if (s.effect === 'genie') {
        // `m` is how far into the dock it is — the mirror of openness, and the
        // direction the shape actually reads in.
        const m = clamp(1 - e, 0, 1)
        const lead = 1 - Math.pow(1 - m, 3)                 // vertical collapse, out front
        const lag = Math.pow(m, 1 + 3 * s.genieStagger)     // horizontal squeeze, behind it

        // Anchor the transform at the dock icon's x on the window's bottom edge,
        // so the squeeze already aims at the icon and only the leftover offset
        // has to be translated away.
        const originX = clamp(dock.cx - win.left, 0, win.width)
        const sx = Math.max(0.001, 1 - s.genieSqueeze * 0.97 * lag)
        const sy = Math.max(0.001, 1 - s.genieSqueeze * lead)

        const spill = dock.cx - win.left - originX                      // non-zero only once clamped
        const bend = (dock.cx - (win.left + win.width / 2)) * s.genieBend
        const tx = (spill + bend) * m
        const ty = (dock.cy - (win.top + win.height)) * m

        return {
            transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scaleX(${sx.toFixed(4)}) scaleY(${sy.toFixed(4)})`,
            transformOrigin: `${originX.toFixed(1)}px 100%`,
            opacity: fade,
        }
    }

    // Scale. From the dock icon it starts at the icon's own size and travels;
    // from its own centre it just grows in place.
    const fromDock = s.origin === 'dock'
    const start = fromDock
        ? clamp(dock.size / Math.max(1, win.width), 0.02, 0.95)
        : clamp(s.startScale, 0.02, 0.99)
    const scale = Math.max(0.001, start + (1 - start) * e)
    const travel = 1 - e
    const dx = fromDock ? (dock.cx - (win.left + win.width / 2)) * travel : 0
    const dy = fromDock ? (dock.cy - (win.top + win.height / 2)) * travel : 0

    return {
        transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale.toFixed(4)})`,
        transformOrigin: '50% 50%',
        opacity: fade,
    }
}

/**
 * Opening and closing, animated.
 *
 * Deliberately *outside* `useWindowManager`: the manager stays a pure state
 * machine and this layer only borrows two of its transitions.
 *
 *   opening — detected. `open` going false → true plays the animation from a
 *             layout effect, so every route in (dock, terminal `open`, the
 *             panel's replay) is covered without any of them knowing this hook
 *             exists.
 *   closing — intercepted. `close(id)` here plays first and calls the manager's
 *             `close` only when the animation finishes, so the window is still
 *             genuinely open — and therefore still rendered — for its duration.
 *             That means no "is closing" state to keep in sync, and no frame
 *             where the window blinks out and back.
 *
 * The animated element is the inner `.window` section, never the `Rnd` wrapper:
 * react-rnd positions that wrapper with its own `transform`, and writing to it
 * would fight the drag layer.
 */
export function useWindowAnimation({ windows, settings, desktopRef, dockRef, close, toggleFromDock }) {
    const frames = useRef({})       // id -> the .window element
    const binders = useRef({})      // id -> its memoised ref callback
    const running = useRef({})      // id -> { anim, direction }
    const prevOpen = useRef({})

    // Read through refs so the layout effect below doesn't re-run on every
    // settings change — and so a slider dragged mid-flight can't restart an
    // animation that is already in the air.
    const settingsRef = useRef(settings)
    settingsRef.current = settings
    const closeRef = useRef(close)
    closeRef.current = close
    const toggleRef = useRef(toggleFromDock)
    toggleRef.current = toggleFromDock
    const windowsRef = useRef(windows)
    windowsRef.current = windows

    /** Stable per id, so React doesn't detach and reattach the ref every render. */
    const bind = useCallback((id) => (
        binders.current[id] ??= (el) => {
            if (el) frames.current[id] = el
            else delete frames.current[id]
        }
    ), [])

    /**
     * The window's box and its dock icon's centre, both in desktop coordinates.
     * Measured live rather than read off the manager's geometry, because the
     * mobile layout ignores geometry entirely — there the frame is whatever
     * `.mobile-window` gives it.
     */
    const measure = useCallback((id) => {
        const el = frames.current[id]
        const desk = desktopRef.current
        if (!el || !desk) return null

        const d = desk.getBoundingClientRect()
        const w = el.getBoundingClientRect()
        if (!w.width || !w.height) return null

        const icon = dockRef.current?.querySelector(`[data-window-id="${id}"]`)
        const i = icon?.getBoundingClientRect()

        return {
            win: { left: w.left - d.left, top: w.top - d.top, width: w.width, height: w.height },
            // Falling back to a point below the window's own bottom edge keeps the
            // animation directional when the icon can't be found — the dock
            // scrolled sideways on a narrow phone, say.
            dock: i && i.width
                ? { cx: i.left + i.width / 2 - d.left, cy: i.top + i.height / 2 - d.top, size: Math.max(i.width, i.height) }
                : { cx: w.left - d.left + w.width / 2, cy: w.top - d.top + w.height + 80, size: 44 },
        }
    }, [desktopRef, dockRef])

    /**
     * Play one direction on one window. `onDone` runs on a natural finish and
     * never on a cancel — that distinction is what stops an interrupted close
     * from committing itself after the visitor has reopened the window.
     */
    const play = useCallback((id, direction, onDone) => {
        const s = settingsRef.current
        const el = frames.current[id]

        running.current[id]?.anim.cancel()

        const reduced = s.respectReducedMotion
            && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        const ms = (direction === 'open' ? s.openDuration : s.closeDuration) / clamp(s.speed, 0.25, 2)

        const box = el && typeof el.animate === 'function' ? measure(id) : null
        if (!box || s.effect === 'none' || reduced || ms < 16) {
            onDone?.()
            return
        }

        const ease = EASINGS[s.easing] ?? EASINGS.standard
        const keyframes = []
        for (let i = 0; i <= STEPS; i++) {
            const p = i / STEPS
            // Closing is the open curve run backwards through time, not a
            // separate curve — so a hard ease-out open gives a hard ease-in close.
            keyframes.push(frameAt(s, box.win, box.dock, direction === 'open' ? ease(p) : ease(1 - p)))
        }

        el.style.willChange = 'transform, opacity'
        const anim = el.animate(keyframes, { duration: ms, easing: 'linear', fill: 'none' })
        running.current[id] = { anim, direction }

        // Identity-guarded: a cancel is delivered asynchronously, by which point
        // a newer animation may already own the slot.
        const release = () => {
            if (running.current[id]?.anim !== anim) return
            running.current[id] = null
            el.style.willChange = ''
        }
        anim.onfinish = () => { release(); onDone?.() }
        anim.oncancel = release
    }, [measure])

    /** The close animation currently collapsing this window, if there is one. */
    const collapsing = (id) => {
        const active = running.current[id]
        // `playState` and not merely "we started one": the only thing that clears
        // the slot is the animation's own finish or cancel callback, and those
        // are not guaranteed to arrive — a window minimised mid-close stops being
        // rendered, and the callback with it. Trusting the bookkeeping alone
        // wedged the window shut: every later close hit the guard and returned,
        // so the red button and Esc both went dead for good.
        return active?.direction === 'close' && active.anim.playState === 'running'
            ? active
            : null
    }

    /**
     * Closing, intercepted. Everything that closes a window routes through here
     * — the red traffic light, Esc, and the terminal's `close` and `exit`.
     */
    const closeWindow = useCallback((id) => {
        // Clicking the red button again while it collapses means "now", not
        // "start a second animation over the top of the first".
        const active = collapsing(id)
        if (active) {
            active.anim.finish()
            return
        }
        const state = windowsRef.current[id]
        if (!state?.open || state.minimized) {
            closeRef.current(id)
            return
        }
        play(id, 'close', () => closeRef.current(id))
    }, [play])

    /**
     * Dock click. Passed straight through, except while the window is collapsing
     * — there it reads as "bring it back", so the close is abandoned and the
     * window grows out again. Without this the manager still sees an open
     * window, and a dock click during those 200ms *minimises* the thing the
     * visitor was reaching for, which then closes anyway when the animation ends.
     */
    const dockToggle = useCallback((id) => {
        const active = collapsing(id)
        if (active) {
            active.anim.cancel()    // cancel, not finish: `close` must not commit
            play(id, 'open')
            return
        }
        toggleRef.current(id)
    }, [play])

    /**
     * Opening, detected. A layout effect rather than an event handler so it fires
     * before paint: the window's first painted frame is already the collapsed
     * one, with no flash of the full-size window behind it.
     *
     * Keyed on `open` alone, not on visibility. A window coming back from
     * minimised keeps `open` true throughout, so minimise and restore stay
     * exactly as instant as they always were.
     */
    useLayoutEffect(() => {
        const previous = prevOpen.current
        const next = {}
        for (const id in windows) {
            next[id] = windows[id].open
            if (next[id] && !previous[id]) play(id, 'open')
        }
        prevOpen.current = next
    }, [windows, play])

    return { bind, close: closeWindow, toggleFromDock: dockToggle }
}

export default useWindowAnimation
