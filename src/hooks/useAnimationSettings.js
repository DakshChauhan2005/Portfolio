import { useCallback, useEffect, useState } from 'react'
import { DEFAULTS, ENUMS } from '../data/windowAnimation'

const KEY = 'portfolio:window-animation'

/**
 * Merge a stored blob over the defaults, dropping anything that doesn't match
 * the shape declared in `windowAnimation.js`. localStorage is user-writable, so
 * a stray value would otherwise reach the keyframe builder and produce
 * `scale(NaN)` — which renders as an invisible window, not as an error.
 */
const sanitize = (raw) => {
    const out = { ...DEFAULTS }
    if (!raw || typeof raw !== 'object') return out
    for (const key of Object.keys(DEFAULTS)) {
        const value = raw[key]
        if (typeof value !== typeof DEFAULTS[key]) continue
        if (typeof value === 'number' && !Number.isFinite(value)) continue
        if (ENUMS[key] && !ENUMS[key].includes(value)) continue
        out[key] = value
    }
    return out
}

/**
 * The animation settings, persisted per browser.
 *
 * Local rather than session storage on purpose: this is a preference about how
 * the site behaves, so it should still be there next visit — unlike the boot
 * intro's `hasBooted`, which is scoped to the session so tomorrow replays it.
 */
export function useAnimationSettings() {
    const [settings, setSettings] = useState(() => {
        try {
            return sanitize(JSON.parse(localStorage.getItem(KEY)))
        } catch {
            // Private mode, disabled storage, or corrupt JSON — defaults are fine.
            return { ...DEFAULTS }
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify(settings))
        } catch {
            // Nothing to do about a full or blocked quota; the session still works.
        }
    }, [settings])

    const update = useCallback((key, value) => {
        setSettings(prev => (prev[key] === value ? prev : { ...prev, [key]: value }))
    }, [])

    const reset = useCallback(() => setSettings({ ...DEFAULTS }), [])

    return { settings, update, reset }
}

export default useAnimationSettings
