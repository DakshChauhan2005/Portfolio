import { useCallback, useEffect, useState } from 'react'

/**
 * Merge a stored blob over the defaults, dropping anything that doesn't match
 * the declared shape. localStorage is user-writable, so an unchecked value
 * would otherwise reach a keyframe builder and produce `scale(NaN)` — which
 * renders as an invisible window, not as an error — or name a wallpaper that
 * does not exist.
 *
 * `defaults` is the shape: a key absent from it is ignored, and a value of the
 * wrong type or outside its enum falls back to the default for that key.
 */
const sanitize = (raw, defaults, enums) => {
    const out = { ...defaults }
    if (!raw || typeof raw !== 'object') return out
    for (const key of Object.keys(defaults)) {
        const value = raw[key]
        if (typeof value !== typeof defaults[key]) continue
        if (typeof value === 'number' && !Number.isFinite(value)) continue
        if (enums[key] && !enums[key].includes(value)) continue
        out[key] = value
    }
    return out
}

/**
 * A settings object persisted per browser, validated on the way in.
 *
 * Local rather than session storage on purpose: these are preferences about how
 * the site behaves, so they should still be there next visit — unlike the boot
 * intro's `hasBooted`, which is scoped to the session so tomorrow replays it.
 *
 * `defaults` and `enums` are expected to be module-level constants; they are
 * read on first render and by `reset`, never diffed.
 */
export function usePersistentSettings(storageKey, defaults, enums = {}) {
    const [settings, setSettings] = useState(() => {
        try {
            return sanitize(JSON.parse(localStorage.getItem(storageKey)), defaults, enums)
        } catch {
            // Private mode, disabled storage, or corrupt JSON — defaults are fine.
            return { ...defaults }
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(settings))
        } catch {
            // Nothing to do about a full or blocked quota; the session still works.
        }
    }, [storageKey, settings])

    const update = useCallback((key, value) => {
        setSettings(prev => (prev[key] === value ? prev : { ...prev, [key]: value }))
    }, [])

    const reset = useCallback(() => setSettings({ ...defaults }), [defaults])

    return { settings, update, reset }
}

export default usePersistentSettings
