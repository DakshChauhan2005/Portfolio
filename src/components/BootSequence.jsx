import { useEffect, useRef } from 'react'
import { markBooted } from './bootGate'
import { asset } from '../utils/asset'
import './bootSequence.scss'

/**
 * The sequence's natural length in ms. Every timestamp in `T` is written
 * against it, and `k` (the real runtime divided by this) scales them all
 * together — so changing `runtime` re-times the whole boot instead of pulling
 * its parts out of step.
 */
const BASE_RUNTIME = 8600

/** [start, duration] in ms, or a bare start. */
const T = {
    bloomIn: [0, 320],
    bloomFall: [320, 560],
    logo: [300, 520],
    bar: [620, 300],
    fill: [660, 1740],
    caption: [700, 320],
    wordmark: [1250, 480],
    // Everything on the logo screen fades out together here.
    out: [2400, 300],
    greetStart: 2760,
    greetStep: 372,
    greetTail: 240,
    flash: [7480, 560],
    // The moment the desktop starts arriving. Reported to the parent, which
    // runs the menu bar and dock entrances off it in CSS.
    reveal: 7560,
    veil: [7600, 480],
}

const GREETINGS = [
    'hello', 'hola', 'bonjour', 'ciao', 'olá', 'hallo',
    'привет', 'שלום', 'مرحبا', 'नमस्ते', 'こんにちは', '안녕하세요',
]

const CAPTIONS = [
    [0, 'Verifying startup disk'],
    [1400, 'Mounting projects'],
    [2100, 'Starting desktop'],
]

// prefers-reduced-motion gets none of the above: just a plain fade off black.
const REDUCED_FADE = 600

// A tap or a keypress anywhere skips ahead to the flash — but only once the
// logo is up (so the very first frames can't be skipped past accidentally).
const SKIP_AFTER = 1000

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)
const easeOut = (p) => 1 - Math.pow(1 - p, 3)
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

/**
 * The first-boot intro: black screen, Apple logo over a progress bar, then the
 * macOS "hello" greeting cycle, a flash, and the desktop underneath.
 *
 * It is a fixed overlay above the whole app (the menu bar is z-index 1000) and
 * paints straight to the DOM from a requestAnimationFrame loop rather than
 * through React state. Ten elements re-rendering sixty times a second while
 * the window chunks are prefetching in the background is the one place in this
 * app where that difference is visible.
 *
 * The wallpaper is deliberately *not* animated here. It is a `body` background
 * so it can paint before React runs (see index.html's preload); the reveal
 * therefore lifts the black veil off the real desktop instead of fading in a
 * duplicate copy of it.
 */
const BootSequence = ({
    wordmark = 'Daksh Chauhan',
    runtime = BASE_RUNTIME / 1000,
    bloom = true,
    captions = true,
    flashStrength = 0.18,
    onReveal,
    onFinish,
}) => {
    const veilRef = useRef(null)
    const bloomRef = useRef(null)
    const logoRef = useRef(null)
    const wordRef = useRef(null)
    const barRef = useRef(null)
    const fillRef = useRef(null)
    const captionRef = useRef(null)
    const greetRef = useRef(null)
    const flashRef = useRef(null)

    useEffect(() => {
        let reduced = false
        try {
            reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        } catch {
            reduced = false
        }

        const k = (runtime * 1000) / BASE_RUNTIME
        const total = reduced ? REDUCED_FADE : runtime * 1000
        const revealAt = reduced ? 0 : T.reveal * k

        const set = (ref, opacity, transform) => {
            const el = ref.current
            if (!el) return
            el.style.opacity = opacity
            if (transform !== undefined) el.style.transform = transform
        }
        const setText = (ref, text) => {
            const el = ref.current
            if (el && el.textContent !== text) el.textContent = text
        }

        const paintReduced = (t) => {
            set(veilRef, 1 - easeOut(clamp01(t / REDUCED_FADE)))
        }

        const paint = (t) => {
            const seg = (start, dur) => clamp01((t - start * k) / (dur * k))
            // Unscaled time, for the cues that are compared against plain
            // timestamps rather than run through `seg`.
            const ct = t / k

            const out = 1 - seg(...T.out)
            const logoIn = easeOut(seg(...T.logo))
            const wordIn = easeOut(seg(...T.wordmark))

            set(veilRef, 1 - easeOut(seg(...T.veil)))
            set(
                bloomRef,
                bloom
                    ? Math.max(0, 0.62 * easeOut(seg(...T.bloomIn)) - 0.32 * easeOut(seg(...T.bloomFall))) * out
                    : 0,
            )
            set(logoRef, logoIn * out, `scale(${0.96 + 0.04 * logoIn})`)
            set(wordRef, wordmark === '' ? 0 : wordIn * out, `translateY(${6 * (1 - wordIn)}px)`)
            set(barRef, easeOut(seg(...T.bar)) * out)
            set(fillRef, 1, `scaleX(${easeInOut(seg(...T.fill))})`)
            set(captionRef, captions ? easeOut(seg(...T.caption)) * 0.9 * out : 0)

            // A quick blow-out to white: up over the first third of the window,
            // down over the rest. Never at full strength — this sits over the
            // desktop, not over black.
            const fp = seg(...T.flash)
            const flash = fp <= 0 || fp >= 1 ? 0 : fp < 0.35 ? fp / 0.35 : 1 - (fp - 0.35) / 0.65
            set(flashRef, flash * flashStrength)

            let caption = CAPTIONS[0][1]
            for (const [at, text] of CAPTIONS) if (ct > at) caption = text
            setText(captionRef, caption)

            // The greeting cycle: one word per `greetStep`, each fading in over
            // its first third and out over its last, except the last word which
            // holds and then fades once for the handoff.
            const greetEnd = T.greetStart + T.greetStep * GREETINGS.length
            let greetOpacity = 0
            let greetScale = 1
            if (ct >= T.greetStart && ct < greetEnd + T.greetTail) {
                const raw = (ct - T.greetStart) / T.greetStep
                const i = Math.min(GREETINGS.length - 1, Math.floor(raw))
                const p = Math.min(1, raw - i)
                const last = i === GREETINGS.length - 1
                const fadeIn = Math.min(1, p / 0.34)
                const fadeOut = last ? 1 - seg(greetEnd, 260) : p > 0.62 ? 1 - (p - 0.62) / 0.38 : 1
                greetOpacity = easeOut(fadeIn) * Math.max(0, fadeOut)
                greetScale = 0.988 + 0.022 * easeOut(Math.min(1, p * 1.6))
                setText(greetRef, GREETINGS[i])
            }
            set(greetRef, greetOpacity, `scale(${greetScale})`)
        }

        let t = 0
        let last = null
        let revealed = false
        let raf = 0

        // Ends the intro for good. `onFinish` drops the overlay and the class
        // holding the menu bar and dock back, so this is what uncovers the
        // desktop whether or not the sequence got to play out.
        const done = () => {
            markBooted()
            onFinish?.()
        }

        const frame = (ts) => {
            if (last == null) last = ts
            // Capped, so a backgrounded tab resumes rather than jumping to the
            // end with a single enormous delta.
            t = Math.min(t + Math.min(64, ts - last), total)
            last = ts

            try {
                if (reduced) paintReduced(t)
                else paint(t)
            } catch (error) {
                // A throw in here is invisible to React's error boundaries —
                // and it would leave the veil frozen over the whole portfolio.
                // Cut to the desktop instead of stranding the visitor on black.
                console.error('[boot] sequence failed', error)
                done()
                return
            }

            if (!revealed && t >= revealAt) {
                revealed = true
                onReveal?.(k)
            }
            if (t >= total) {
                done()
                return
            }
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)

        const skip = () => {
            if (reduced) return
            if (t < SKIP_AFTER * k || t >= T.flash[0] * k) return
            t = T.flash[0] * k
        }
        // The overlay is pointer-events: none and the desktop behind it is
        // inert, so both of these arrive here whatever was clicked.
        document.addEventListener('pointerdown', skip)
        document.addEventListener('keydown', skip)

        return () => {
            cancelAnimationFrame(raf)
            document.removeEventListener('pointerdown', skip)
            document.removeEventListener('keydown', skip)
        }
    }, [runtime, wordmark, bloom, captions, flashStrength, onReveal, onFinish])

    return (
        <div className="boot" aria-hidden="true">
            <div className="boot__veil" ref={veilRef} />

            <div className="boot__stage">
                <div className="boot__bloom" ref={bloomRef} />
                <img className="boot__logo" ref={logoRef} src={asset('/navbar-icons/apple.svg')} alt="" />
                <div className="boot__wordmark" ref={wordRef}>{wordmark}</div>
                <div className="boot__bar" ref={barRef}>
                    <div className="boot__fill" ref={fillRef} />
                </div>
                <div className="boot__caption" ref={captionRef} />
            </div>

            <div className="boot__greetings">
                <div className="boot__greeting" ref={greetRef} dir="auto">{GREETINGS[0]}</div>
            </div>

            <div className="boot__flash" ref={flashRef} />
        </div>
    )
}

export default BootSequence
