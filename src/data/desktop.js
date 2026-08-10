/**
 * Everything tunable about the *desktop* — which wallpaper is up, how much it
 * moves, whether it makes a sound, and what the type looks like.
 *
 * Same contract as `windowAnimation.js`, deliberately: DEFAULTS and ENUMS seed
 * and validate the persisted state, CONTROLS is the whole form. The settings
 * panel renders both schemas through the same `SettingsField`, which is why
 * adding a knob here is still one line in DEFAULTS plus one entry in CONTROLS.
 *
 * The one thing CONTROLS does *not* describe is the wallpaper grid and the two
 * font lists: those are pickers that have to render a preview of the thing they
 * select, so the panel draws them itself from `wallpapers.js` and `fonts.js`.
 */

import { displayFontIds, uiFontIds } from './fonts'
import { DEFAULT_WALLPAPER, wallpaperIds } from './wallpapers'

export const DEFAULTS = {
    // The first scene in the catalogue. Every wallpaper is a canvas scene now —
    // the still photo was removed — so `app.scss` paints a matching gradient on
    // `body` to stand in for the fraction of a second before the chunk lands.
    wallpaper: DEFAULT_WALLPAPER,
    motion: 1,
    interactive: true,
    // Never on by default. Browsers block unprompted audio anyway, and a
    // portfolio that starts making noise is a portfolio people close.
    sound: false,
    volume: 0.55,
    // The name of the audio file the visitor put on the Vinyl Hour turntable —
    // the *name* only. The file itself is far too big for localStorage and
    // lives in IndexedDB (`utils/trackStore.js`); this is what the panel prints
    // and what tells `LiveWallpaper` to go and fetch it again. Empty means the
    // bundled track.
    trackName: '',
    headline: true,
    displayFont: 'script',
    headlineScale: 1,
    uiFont: 'system',
}

export const ENUMS = {
    wallpaper: wallpaperIds,
    displayFont: displayFontIds,
    uiFont: uiFontIds,
}

/**
 * The panel's form. `tab` picks which of the panel's three tabs a control sits
 * on; `section` is the heading inside it, and consecutive entries sharing one
 * render under a single heading, exactly as in `windowAnimation.js`.
 */
export const CONTROLS = [
    {
        key: 'motion', type: 'range', tab: 'wallpaper', section: 'Motion', label: 'Intensity',
        min: 0, max: 1.8, step: 0.1, unit: '×', precision: 1,
        hint: 'Scales every drift, spin and particle. Zero leaves the scene still.',
    },
    {
        key: 'interactive', type: 'toggle', tab: 'wallpaper', section: 'Motion',
        label: 'React to the cursor',
        hint: 'Off, the wallpaper plays on its own and ignores the pointer.',
    },

    {
        key: 'sound', type: 'toggle', tab: 'wallpaper', section: 'Ambience',
        label: 'Ambient sound',
        hint: 'Each scene has its own, synthesised on the fly — Vinyl Hour is the one that plays a real track. Also on the menu bar, beside the Wi-Fi icon.',
    },
    {
        key: 'volume', type: 'range', tab: 'wallpaper', section: 'Ambience', label: 'Volume',
        min: 0, max: 1, step: 0.05, precision: 2,
        showIf: (s) => s.sound,
    },

    {
        key: 'headline', type: 'toggle', tab: 'fonts', section: 'Headline',
        label: 'Show the headline',
        hint: 'The name set across the wallpaper, in the face chosen above.',
    },
    {
        key: 'headlineScale', type: 'range', tab: 'fonts', section: 'Headline', label: 'Headline size',
        min: 0.6, max: 1.4, step: 0.05, unit: '×', precision: 2,
        showIf: (s) => s.headline,
    },
]

export default DEFAULTS
