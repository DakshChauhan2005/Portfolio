import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HINTS, HINT_HOLD, HINT_LEAD } from '../data/hints'
import './desktopHints.scss'

/**
 * The post-boot tour: a small card that walks itself around the desktop once,
 * ringing the thing it is talking about, and then gets out of the way.
 *
 * Deliberately *not* a modal. There is no dimming layer and no focus trap: the
 * desktop stays fully usable underneath, because the whole point is to get the
 * visitor to touch it. What that buys, and what it costs:
 *
 * - **The overlay never takes a pointer event.** It is `pointer-events: none`
 *   except for the card's own button, so the wallpaper still gets the click the
 *   first hint is asking for. `LiveWallpaper`'s `overDesktop` selector lists
 *   `.desktop-hints` for the other half of that deal — a click on the card
 *   itself must not also fire a lightning strike behind it.
 * - **Touching a real control ends the tour.** Once the visitor has opened
 *   Settings or a window they have stopped reading, and the card is in the way.
 *   A click on empty desktop is *not* dismissal: that is the tour being obeyed
 *   rather than skipped.
 *
 * Only `step` is React state — the content of the card. **Position is written
 * straight to the three nodes** from a layout effect, the way `BootSequence`
 * paints: it is measured from the live DOM, so it is not something React can
 * hold, and re-rendering the card to move it would restart the entrance
 * animation every time the window resized.
 *
 * `App` mounts this only when the boot intro actually played, so it runs once a
 * session and never on a reload — see the `hints` state there.
 */

/**
 * Card width, per viewport. Must match `--hint-card-w` in the stylesheet: the
 * card is sized in CSS, but clamping it against the screen edge — and keeping
 * the caret pointing after that clamp — is arithmetic, so it happens here.
 */
const CARD_W = 300
const CARD_W_MOBILE = 340

/** Ring padding around the target, gap from ring to card, and caret size. */
const PAD = 7
const GAP = 12
const CARET = 7

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n)

export default function DesktopHints({ mobile = false, onDone }) {
    // -1 is the lead-in: mounted and timing, but not yet showing a card.
    const [step, setStep] = useState(-1)
    const cardRef = useRef(null)
    const ringRef = useRef(null)
    const caretRef = useRef(null)

    const hint = step >= 0 ? HINTS[step] : null

    /**
     * Advance on a timer; the last card's timeout is what ends the tour.
     *
     * Held while the tab is hidden, and restarted from the top of the current
     * card when it comes back. A `setTimeout` keeps running in a background tab
     * — so without this, opening the site in a background tab and coming to it
     * a minute later means the whole tour has already played to an empty room.
     */
    useEffect(() => {
        let timer = 0
        const sync = () => {
            clearTimeout(timer)
            if (document.hidden) return
            timer = setTimeout(() => {
                if (step + 1 >= HINTS.length) onDone?.()
                else setStep(step + 1)
            }, step < 0 ? HINT_LEAD : HINT_HOLD)
        }
        sync()
        document.addEventListener('visibilitychange', sync)
        return () => {
            clearTimeout(timer)
            document.removeEventListener('visibilitychange', sync)
        }
    }, [step, onDone])

    /**
     * Place the ring, the card and the caret against the target's real box.
     * Measured rather than hard-coded, so moving the settings button or
     * restyling the dock can't leave the ring behind — and a selector that
     * matches nothing degrades to the centred, ringless form instead of
     * stranding a ring in the top-left corner.
     */
    const place = useCallback(() => {
        const card = cardRef.current
        if (!hint || !card) return

        const ring = ringRef.current
        const caret = caretRef.current
        const target = hint.target ? document.querySelector(hint.target) : null
        const box = target?.getBoundingClientRect()

        if (!box || !box.width || !box.height) {
            card.classList.add('centred')
            card.removeAttribute('style')
            if (ring) ring.style.display = 'none'
            if (caret) caret.style.display = 'none'
            return
        }

        const vw = window.innerWidth
        const above = hint.place === 'above'
        const cardW = Math.min(mobile ? CARD_W_MOBILE : CARD_W, vw - 24)
        const middle = box.left + box.width / 2
        const left = clamp(middle - cardW / 2, 12, Math.max(12, vw - cardW - 12))
        // The card's edge on the target's side. Derived from the ring, since
        // nothing here knows how tall the card is until it has been laid out.
        const edge = above ? box.top - GAP - PAD : box.top + box.height + GAP + PAD

        card.classList.remove('centred')
        card.style.left = `${left}px`
        if (above) {
            card.style.top = 'auto'
            card.style.bottom = `${window.innerHeight - edge}px`
        } else {
            card.style.bottom = 'auto'
            card.style.top = `${edge}px`
        }

        if (ring) {
            ring.style.display = ''
            ring.style.top = `${box.top - PAD}px`
            ring.style.left = `${Math.max(2, box.left - PAD)}px`
            ring.style.width = `${Math.min(vw - 4, box.width + PAD * 2)}px`
            ring.style.height = `${box.height + PAD * 2}px`
            ring.style.borderRadius = `${(hint.radius ?? 10) + PAD}px`
        }

        if (caret) {
            caret.style.display = ''
            // Clamped inside the card, so a card pushed off-centre by the edge
            // of the screen still points at its target from the corner.
            caret.style.left = `${clamp(middle, left + 18, left + cardW - 18) - CARET}px`
            caret.style.top = `${above ? edge : edge - CARET}px`
        }
    }, [hint, mobile])

    useLayoutEffect(() => {
        place()
        // The dock re-centres and the menu bar reflows on a resize, and this
        // card is pointing at both of them.
        window.addEventListener('resize', place)
        return () => window.removeEventListener('resize', place)
    }, [place])

    /**
     * Any use of a real control ends the tour. Empty desktop is exempt — that
     * is the first hint being followed. Capture phase, so a click that opens a
     * window dismisses on the way down rather than a frame later.
     */
    useEffect(() => {
        const onPointerDown = (event) => {
            const el = event.target
            if (el instanceof Element && el.closest('nav, .dock, .window, .mobile-window')) {
                onDone?.()
            }
        }
        window.addEventListener('pointerdown', onPointerDown, true)
        return () => window.removeEventListener('pointerdown', onPointerDown, true)
    }, [onDone])

    if (!hint) return null

    return (
        <div className={`desktop-hints${mobile ? ' mobile' : ''}`}>
            {/* Both are keyed on the hint, like the card: a fresh element per
                step is what restarts the CSS entrance, since nothing in here
                drives an animation from JS. */}
            {hint.target && <div key={`${hint.id}-ring`} className="ring" ref={ringRef} />}
            {hint.target && (
                <span
                    key={`${hint.id}-caret`}
                    className={`caret ${hint.place}`}
                    ref={caretRef}
                    aria-hidden="true"
                />
            )}

            <div
                key={hint.id}
                className={`card${hint.target ? '' : ' centred'}`}
                ref={cardRef}
                role="status"
                aria-live="polite"
            >
                <p className="title">{hint.title}</p>
                <p className="body">{hint.body}</p>

                <div className="foot">
                    <span className="dots" aria-hidden="true">
                        {HINTS.map((h, i) => (
                            <span key={h.id} className={i === step ? 'dot on' : 'dot'} />
                        ))}
                    </span>
                    <button type="button" onClick={onDone}>Got it</button>
                </div>

                {/* Time left on this card, ticked by CSS rather than by a timer
                    here — the duration is the same constant the timeout uses. */}
                <span
                    className="progress"
                    style={{ animationDuration: `${HINT_HOLD}ms` }}
                    aria-hidden="true"
                />
            </div>
        </div>
    )
}
