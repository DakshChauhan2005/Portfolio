import { DEFAULTS, ENUMS } from '../data/windowAnimation'
import usePersistentSettings from './usePersistentSettings'

const KEY = 'portfolio:window-animation'

/**
 * The window open/close animation's settings, persisted per browser.
 *
 * Storage, validation and the update/reset pair all come from
 * `usePersistentSettings`; this hook is just the schema and the key. The
 * desktop's own settings work the same way — see `useDesktopSettings`.
 */
export function useAnimationSettings() {
    return usePersistentSettings(KEY, DEFAULTS, ENUMS)
}

export default useAnimationSettings
