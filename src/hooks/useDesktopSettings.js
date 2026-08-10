import { DEFAULTS, ENUMS } from '../data/desktop'
import usePersistentSettings from './usePersistentSettings'

const KEY = 'portfolio:desktop'

/**
 * Wallpaper, motion, ambient sound and typography, persisted per browser.
 *
 * Kept in its own storage key from the window animation's settings so that
 * resetting one doesn't silently reset the other — the panel's Reset button
 * belongs to whichever tab is showing.
 */
export function useDesktopSettings() {
    return usePersistentSettings(KEY, DEFAULTS, ENUMS)
}

export default useDesktopSettings
