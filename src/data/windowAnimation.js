/**
 * Everything tunable about the window *open and close* animation, declared once.
 *
 * Three consumers read this file and nothing else:
 *   - `useAnimationSettings` seeds and validates its state from DEFAULTS/ENUMS,
 *   - `useWindowAnimation` samples EASINGS while building keyframes,
 *   - `AnimationSettings` renders its entire form from CONTROLS.
 *
 * So adding a knob is one line in DEFAULTS plus one entry in CONTROLS — no
 * component and no engine code has to change.
 *
 * Scope note: this drives opening and closing only. Minimise and restore are
 * deliberately left instant, exactly as they were.
 */

/**
 * Named curves. They are sampled in JS rather than handed to CSS because the
 * genie needs two *different* curves inside one transform — the vertical
 * collapse leading the horizontal squeeze — which a single CSS timing function
 * can't express. Input and output are both 0..1 (overshoot leaves the range on
 * purpose; the engine clamps the scale it produces).
 */
export const EASINGS = {
    standard: (p) => 1 - Math.pow(1 - p, 3),
    snappy: (p) => 1 - Math.pow(1 - p, 5),
    smooth: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    overshoot: (p) => {
        const c1 = 1.70158
        const c3 = c1 + 1
        return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
    },
    linear: (p) => p,
}

export const EFFECTS = [
    { value: 'scale', label: 'Scale', hint: 'Grows out of the dock icon and settles into place.' },
    { value: 'genie', label: 'Genie', hint: 'Squeezes down into the dock, macOS style.' },
    { value: 'fade', label: 'Fade', hint: 'Opacity only, with a hair of scale behind it.' },
    { value: 'none', label: 'None', hint: 'Instant. Windows appear and vanish.' },
]

export const EASING_OPTIONS = [
    { value: 'standard', label: 'Standard — ease out' },
    { value: 'snappy', label: 'Snappy — hard ease out' },
    { value: 'smooth', label: 'Smooth — ease in out' },
    { value: 'overshoot', label: 'Overshoot — settles back' },
    { value: 'linear', label: 'Linear — no easing' },
]

export const ORIGINS = [
    { value: 'dock', label: 'Dock icon' },
    { value: 'center', label: 'Own centre' },
]

export const DEFAULTS = {
    effect: 'scale',
    easing: 'standard',
    origin: 'dock',
    openDuration: 260,
    closeDuration: 200,
    speed: 1,
    startScale: 0.86,
    startOpacity: 0,
    fadeRate: 2.4,
    genieSqueeze: 0.95,
    genieStagger: 0.5,
    genieBend: 0.35,
    respectReducedMotion: true,
}

/** Allowed values for the non-numeric settings, so a hand-edited localStorage
 *  entry can't put the engine into a state it has no branch for. */
export const ENUMS = {
    effect: EFFECTS.map(e => e.value),
    easing: EASING_OPTIONS.map(e => e.value),
    origin: ORIGINS.map(o => o.value),
}

const isScale = (s) => s.effect === 'scale'
const animates = (s) => s.effect !== 'none'

/**
 * The settings panel's form, in render order.
 *
 *   key       string   matches DEFAULTS
 *   type      'segment' | 'select' | 'range' | 'toggle'
 *   section   heading it sits under; consecutive entries share one heading
 *   showIf    optional predicate over the current settings — a knob that can't
 *             affect anything is hidden rather than shown doing nothing
 *   unit/precision  how the live value readout is formatted
 */
export const CONTROLS = [
    {
        key: 'effect', type: 'segment', section: 'Effect', label: 'Style',
        options: EFFECTS,
    },
    {
        key: 'easing', type: 'select', section: 'Effect', label: 'Easing',
        options: EASING_OPTIONS, showIf: animates,
    },
    {
        key: 'origin', type: 'segment', section: 'Effect', label: 'Grows from',
        options: ORIGINS, showIf: isScale,
        hint: 'Genie always travels to the dock; scale can start in place instead.',
    },

    {
        key: 'openDuration', type: 'range', section: 'Timing', label: 'Open',
        min: 80, max: 900, step: 10, unit: 'ms', showIf: animates,
    },
    {
        key: 'closeDuration', type: 'range', section: 'Timing', label: 'Close',
        min: 80, max: 900, step: 10, unit: 'ms', showIf: animates,
    },
    {
        key: 'speed', type: 'range', section: 'Timing', label: 'Speed',
        min: 0.25, max: 2, step: 0.05, unit: '×', precision: 2, showIf: animates,
        hint: 'Divides both durations, so one slider slows the whole thing down.',
    },

    {
        key: 'startScale', type: 'range', section: 'Shape', label: 'Start scale',
        min: 0.1, max: 0.98, step: 0.02, precision: 2,
        showIf: (s) => isScale(s) && s.origin === 'center',
    },
    {
        key: 'startOpacity', type: 'range', section: 'Shape', label: 'Start opacity',
        min: 0, max: 1, step: 0.05, precision: 2, showIf: animates,
        hint: 'Raise to 1 for a fully opaque window throughout.',
    },
    {
        key: 'fadeRate', type: 'range', section: 'Shape', label: 'Fade rate',
        min: 1, max: 4, step: 0.1, unit: '×', precision: 1, showIf: animates,
        hint: 'How early the fade finishes relative to the movement.',
    },
    {
        key: 'genieSqueeze', type: 'range', section: 'Shape', label: 'Genie squeeze',
        min: 0.6, max: 1, step: 0.01, precision: 2,
        showIf: (s) => s.effect === 'genie',
    },
    {
        key: 'genieStagger', type: 'range', section: 'Shape', label: 'Genie stagger',
        min: 0, max: 1, step: 0.05, precision: 2,
        showIf: (s) => s.effect === 'genie',
        hint: 'How far the horizontal squeeze lags the vertical one.',
    },
    {
        key: 'genieBend', type: 'range', section: 'Shape', label: 'Genie bend',
        min: 0, max: 1, step: 0.05, precision: 2,
        showIf: (s) => s.effect === 'genie',
    },

    {
        key: 'respectReducedMotion', type: 'toggle', section: 'Accessibility',
        label: 'Honour “reduce motion”',
        hint: 'On, and with the OS setting enabled, windows open and close instantly.',
    },
]

export default DEFAULTS
