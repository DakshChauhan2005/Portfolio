import { useEffect, useLayoutEffect, useRef } from 'react'
import { ensureDisplayFonts, getDisplayFont, scaled } from '../data/fonts'
import { profile } from '../data/profile'
import { SCENE_ENGINES, ease } from '../data/wallpaperScenes'
import VOICES from '../data/wallpaperVoices'
import './liveWallpaper.scss'

/**
 * The live wallpaper: one `<canvas>` behind the whole desktop, painted from a
 * requestAnimationFrame loop, plus the ambient voice that goes with the scene.
 *
 * Mounted only while a live wallpaper is selected, and lazily — so the scenes,
 * the audio graph and the display webfonts are a chunk of their own that a
 * visitor who stays on the photo never downloads.
 *
 * Three things are worth knowing before editing this:
 *
 * - **Nothing here goes through React state.** The loop writes to the canvas
 *   and sets one `transform` on the headline directly, the way `BootSequence`
 *   does. Sixty re-renders a second behind five open windows is the one thing
 *   this app can't afford, and none of it is state anything else reads.
 *
 * - **The pointer is tracked on `window`, not on this element.** The wallpaper
 *   is `pointer-events: none` and sits under the desktop, so it can never take
 *   an event away from a window, the dock or the menu bar. It reads them as
 *   they pass and asks `overDesktop` whether the cursor was over free desktop —
 *   which is what makes clicking a window *not* fire a lightning strike.
 *
 * - **The frame is wrapped in a `try`.** A throw inside rAF is invisible to the
 *   error boundaries, and would leave a frozen canvas over the entire desktop;
 *   instead the loop stops and the backdrop gradient stands in for the scene.
 */

/** Old Safari and Firefox < 112 have no roundRect; three scenes draw with it. */
function polyfillRoundRect(ctx) {
    if (ctx.roundRect) return
    ctx.roundRect = function (x, y, w, h, r) {
        const radius = Math.min(typeof r === 'number' ? r : 0, Math.abs(w) / 2, Math.abs(h) / 2)
        this.moveTo(x + radius, y)
        this.arcTo(x + w, y, x + w, y + h, radius)
        this.arcTo(x + w, y + h, x, y + h, radius)
        this.arcTo(x, y + h, x, y, radius)
        this.arcTo(x, y, x + w, y, radius)
        this.closePath()
    }
}

/**
 * Resume an AudioContext, and if the browser refuses — which it does for any
 * context created without a user gesture behind it — try again on the visitor's
 * next interaction. The listeners remove themselves once it is running, so a
 * page that is already playing carries no permanent handlers.
 */
function resumeOnGesture(ac) {
    if (ac.state === 'running') return
    ac.resume()

    const retry = () => {
        ac.resume().finally(() => {
            if (ac.state !== 'running') return
            for (const type of ['pointerdown', 'keydown', 'touchstart']) {
                window.removeEventListener(type, retry)
            }
        })
    }
    for (const type of ['pointerdown', 'keydown', 'touchstart']) {
        window.addEventListener(type, retry)
    }
}

/**
 * True when the event landed on empty desktop rather than on a window, the menu
 * bar, the dock or the settings panel. `closest` walks up from the target, so a
 * click on a button inside a window counts as the window.
 */
const overDesktop = (target) =>
    target instanceof Element
        ? !target.closest('.window, .mobile-window, .react-draggable, nav, .dock, .settings-panel, .boot')
        : true

export default function LiveWallpaper({ wallpaperId, settings, mobile = false, paused = false }) {
    // The catalogue has already guaranteed this id is a live one — App only
    // mounts this component for those — but fall back rather than throw.
    const scene = SCENE_ENGINES[wallpaperId] ?? SCENE_ENGINES.dusk
    const rootRef = useRef(null)
    const canvasRef = useRef(null)
    const headlineRef = useRef(null)

    /**
     * Everything the loop, the listeners and the audio read, in one ref. None
     * of it may be a hook dependency: dragging the volume slider must not tear
     * down and restart a sixty-times-a-second animation.
     */
    const live = useRef({
        scene,
        settings,
        mobile,
        paused,
        state: null,
        pointer: { x: 0.5, y: 0.5, smoothX: 0.5, smoothY: 0.5, active: false, down: false },
        lastInput: 0,
        idle: 0,
        voice: null,
    })

    // Kept in step in a layout effect rather than during render: it runs before
    // paint, so the next frame and every listener already see the new props,
    // and React never sees a ref written mid-render.
    useLayoutEffect(() => {
        live.current.scene = scene
        live.current.settings = settings
        live.current.mobile = mobile
    })

    // The webfonts the headline is set in. Requested here rather than in
    // index.html so the photo wallpaper costs nothing.
    useEffect(ensureDisplayFonts, [])

    /**
     * Re-seed the scene whenever it changes. A layout effect, so the first
     * frame after a switch already has the new scene's state to draw — there is
     * never a frame where `draw` runs against the previous scene's shape.
     */
    useLayoutEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root) return
        const rect = root.getBoundingClientRect()
        // Phones do half the particles: the counts were chosen for a desktop,
        // and a 390px screen shows a fraction of the area at three times the DPR.
        live.current.state = scene.init(rect.width || 1200, rect.height || 800, mobile ? 0.5 : 1)
    }, [scene, mobile])

    /** Size the backing store to the element and the device pixel ratio. */
    useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root) return

        const resize = () => {
            const rect = root.getBoundingClientRect()
            // Capped at 2: a DPR-3 phone would otherwise paint 9× the pixels
            // for a difference nobody can see on a wallpaper.
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.round(rect.width * dpr)
            canvas.height = Math.round(rect.height * dpr)
            const ctx = canvas.getContext('2d')
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            polyfillRoundRect(ctx)
        }

        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(root)
        return () => observer.disconnect()
    }, [])

    /**
     * Pointer tracking. Passive listeners on `window`, so the wallpaper watches
     * the same events the desktop is already handling instead of competing for
     * them. `active` is what a scene reads as `hot`.
     */
    useEffect(() => {
        const read = (event) => {
            const root = rootRef.current
            if (!root) return null
            const rect = root.getBoundingClientRect()
            return {
                x: (event.clientX - rect.left) / rect.width,
                y: (event.clientY - rect.top) / rect.height,
            }
        }

        const onMove = (event) => {
            const p = read(event)
            if (!p) return
            const l = live.current
            l.pointer.x = p.x
            l.pointer.y = p.y
            l.pointer.active = l.settings.interactive && overDesktop(event.target)
            l.lastInput = performance.now()
        }

        const onDown = (event) => {
            const l = live.current
            if (!l.settings.interactive || !overDesktop(event.target)) return
            const p = read(event)
            if (!p) return
            l.pointer.x = p.x
            l.pointer.y = p.y
            l.pointer.active = true
            l.pointer.down = true
            l.lastInput = performance.now()

            const root = rootRef.current
            const rect = root.getBoundingClientRect()
            l.scene.click?.(l.state, p.x * rect.width, p.y * rect.height)
            l.voice?.hit?.()
        }

        const onUp = () => { live.current.pointer.down = false }
        // Pointer left the document entirely — let the scene settle rather than
        // freeze around a cursor that is no longer there.
        const onOut = (event) => {
            if (event.relatedTarget) return
            live.current.pointer.active = false
            live.current.pointer.down = false
        }

        window.addEventListener('pointermove', onMove, { passive: true })
        window.addEventListener('pointerdown', onDown, { passive: true })
        window.addEventListener('pointerup', onUp, { passive: true })
        window.addEventListener('pointercancel', onUp, { passive: true })
        window.addEventListener('pointerout', onOut, { passive: true })
        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerdown', onDown)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onUp)
            window.removeEventListener('pointerout', onOut)
        }
    }, [])

    /**
     * The frame loop. Started once and never restarted: every setting it reads
     * comes off the ref, so dragging the volume slider or switching scenes does
     * not interrupt the animation.
     */
    useEffect(() => {
        // The mirror object is created once and never replaced, so capturing it
        // here is the same object the cleanup and every frame will see.
        const l = live.current
        let raf = 0
        let previous = 0
        let broken = false

        const frame = (now) => {
            const canvas = canvasRef.current
            const root = rootRef.current
            if (broken) { raf = 0; return }
            raf = requestAnimationFrame(frame)
            if (!canvas || !root || !l.state) return

            const rect = root.getBoundingClientRect()
            if (!rect.width || !rect.height) return

            // Clamped: a backgrounded tab resumes with a delta of minutes, which
            // would teleport every particle across the screen in one frame.
            const dt = Math.min(48, now - (previous || now))
            previous = now

            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            const motion = l.settings.motion * (reduced ? 0.25 : 1)

            const p = l.pointer
            p.smoothX = ease(p.smoothX, p.x, 0.07)
            p.smoothY = ease(p.smoothY, p.y, 0.07)
            // Ramps to 1 after five seconds of stillness; scenes use it to
            // settle down rather than shimmer at an empty desk.
            const still = (now - l.lastInput) / 1000 > 5 ? 1 : 0
            l.idle += (still - l.idle) * 0.02

            try {
                const ctx = canvas.getContext('2d')
                ctx.clearRect(0, 0, rect.width, rect.height)
                l.scene.draw(l.state, {
                    ctx,
                    w: rect.width,
                    h: rect.height,
                    t: now,
                    dt,
                    mx: p.smoothX * rect.width,
                    my: p.smoothY * rect.height,
                    hot: p.active,
                    down: p.down,
                    motion,
                    idle: l.idle,
                })
            } catch (error) {
                // Stop rather than throw a frame every 16ms forever. The
                // backdrop gradient is still there, so the desktop looks
                // deliberate rather than broken.
                broken = true
                console.error('Live wallpaper stopped:', error)
                canvas.style.display = 'none'
                return
            }

            if (l.voice?.update && now - (l.lastVoiceUpdate || 0) > 90) {
                l.lastVoiceUpdate = now
                l.voice.update({ x: p.smoothX, y: p.smoothY, hot: p.active })
            }

            // Written straight to the node: this is the only DOM the loop
            // touches outside the canvas, and it is not state anyone reads.
            const headline = headlineRef.current
            if (headline) {
                const tx = (p.smoothX - 0.5) * -16 * motion
                const ty = (p.smoothY - 0.5) * -10 * motion
                headline.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0)`
            }
        }

        /**
         * Start or stop the loop to match the two reasons to stop drawing:
         * a hidden tab (which throttles rAF to a crawl anyway, but stopping
         * outright saves the wake-ups too), and `paused` — set on a phone,
         * where an open window is full-screen and opaque, so every frame drawn
         * behind it is spent on pixels nobody can see.
         */
        const sync = () => {
            const wanted = !document.hidden && !l.paused && !broken
            if (wanted && !raf) {
                // Reset, or the first frame back gets a delta of however long
                // the tab was away.
                previous = 0
                raf = requestAnimationFrame(frame)
            } else if (!wanted && raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }

        l.sync = sync
        document.addEventListener('visibilitychange', sync)
        sync()
        return () => {
            cancelAnimationFrame(raf)
            raf = 0
            l.sync = null
            document.removeEventListener('visibilitychange', sync)
        }
    }, [])

    // `paused` reaches the loop through the ref like everything else, so this
    // only has to nudge it to re-check.
    useEffect(() => {
        live.current.paused = paused
        live.current.sync?.()
    }, [paused])

    /**
     * The ambient voice. Built on the first unmute — an AudioContext created
     * before a gesture starts suspended, and a suspended context that is never
     * resumed is a silent bug people report as "the sound button is broken".
     */
    useEffect(() => {
        const l = live.current
        if (!settings.sound) {
            // Fade out, then tear down. Stopping the sources on the spot would
            // click; nine hundred milliseconds is past the end of the ramp.
            if (l.master && l.audio) l.master.gain.setTargetAtTime(0, l.audio.currentTime, 0.3)
            const timer = setTimeout(() => {
                l.voice?.stop()
                l.voice = null
            }, 900)
            return () => clearTimeout(timer)
        }

        if (!l.audio) {
            const Ctor = window.AudioContext || window.webkitAudioContext
            if (!Ctor) return
            l.audio = new Ctor()
            l.master = l.audio.createGain()
            l.master.gain.value = 0
            l.master.connect(l.audio.destination)
        }
        // Usually a no-op, because turning sound *on* is itself a click. But the
        // setting is remembered, so a reload arrives here with no gesture behind
        // it and the browser hands back a context stuck in `suspended` — the
        // menu bar would show an unmuted speaker over silence. Try, and if it
        // is still suspended, wait for the visitor's first interaction.
        resumeOnGesture(l.audio)
        // Read off the ref, not the closure: the volume has its own effect, and
        // naming it here would rebuild the whole voice on every slider step.
        l.master.gain.setTargetAtTime(l.settings.volume, l.audio.currentTime, 0.5)

        const build = VOICES[scene.id]
        const previous = l.voice
        if (previous) {
            previous.g.gain.setTargetAtTime(0, l.audio.currentTime, 0.25)
            setTimeout(() => { try { previous.stop() } catch { /* already torn down */ } }, 900)
        }
        l.voice = build ? build(l.audio, l.master) : null
        l.voice?.g.gain.setTargetAtTime(1, l.audio.currentTime, 0.6)
        return undefined
    }, [settings.sound, scene])

    /** Volume is its own effect: changing it must not rebuild the voice. */
    useEffect(() => {
        const l = live.current
        if (!l.audio || !l.master || !settings.sound) return
        l.master.gain.setTargetAtTime(settings.volume, l.audio.currentTime, 0.2)
    }, [settings.volume, settings.sound])

    /** Close the audio context for good when the wallpaper goes away. */
    useEffect(() => () => {
        const l = live.current
        try { l.voice?.stop() } catch { /* already torn down */ }
        l.voice = null
        l.audio?.close()
        l.audio = null
    }, [])

    const font = getDisplayFont(settings.displayFont)
    const showHeadline = settings.headline

    return (
        <div className="live-wallpaper" ref={rootRef} aria-hidden="true">
            {/* The scene's flat colour, under the canvas. Every scene has one,
                and they cross-fade, so switching wallpapers is a dissolve rather
                than a cut to black while the first frame is drawn. */}
            {Object.values(SCENE_ENGINES).map(s => (
                <div
                    key={s.id}
                    className="backdrop"
                    style={{ background: s.backdrop, opacity: s.id === scene.id ? 1 : 0 }}
                />
            ))}

            <canvas ref={canvasRef} className="canvas" />

            {/* Vignette and film grain: the two things that stop a canvas of
                flat gradients reading as a CSS demo. Both are pure CSS. */}
            <div className="vignette" />
            <div className="grain" />

            {showHeadline && (
                <div className="headline">
                    <div className="shift" ref={headlineRef}>
                        <div className="line one" style={scaled(font.line1, settings.headlineScale)}>
                            {profile.name}&rsquo;s
                        </div>
                        <div className="line two" style={scaled(font.line2, settings.headlineScale)}>
                            Portfolio
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
