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
import { isLive, wallpaperIds } from './wallpapers'

export const DEFAULTS = {
    // The still photo: it is a `body` background that paints before React runs,
    // so it is the fastest first impression the site can make. The live ones are
    // one click away in the panel.
    wallpaper: 'photo',
    motion: 1,
    interactive: true,
    // Never on by default. Browsers block unprompted audio anyway, and a
    // portfolio that starts making noise is a portfolio people close.
    sound: false,
    volume: 0.55,
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

/** True when the chosen wallpaper is one of the canvas scenes. */
const live = (s) => isLive(s.wallpaper)

/**
 * The panel's form. `tab` picks which of the panel's three tabs a control sits
 * on; `section` is the heading inside it, and consecutive entries sharing one
 * render under a single heading, exactly as in `windowAnimation.js`.
 */
export const CONTROLS = [
    {
        key: 'motion', type: 'range', tab: 'wallpaper', section: 'Motion', label: 'Intensity',
        min: 0, max: 1.8, step: 0.1, unit: '×', precision: 1, showIf: live,
        hint: 'Scales every drift, spin and particle. Zero leaves the scene still.',
    },
    {
        key: 'interactive', type: 'toggle', tab: 'wallpaper', section: 'Motion',
        label: 'React to the cursor', showIf: live,
        hint: 'Off, the wallpaper plays on its own and ignores the pointer.',
    },

    {
        key: 'sound', type: 'toggle', tab: 'wallpaper', section: 'Ambience',
        label: 'Ambient sound', showIf: live,
        hint: 'Each scene has its own, synthesised on the fly — nothing is downloaded. Also on the menu bar, beside the Wi-Fi icon.',
    },
    {
        key: 'volume', type: 'range', tab: 'wallpaper', section: 'Ambience', label: 'Volume',
        min: 0, max: 1, step: 0.05, precision: 2,
        showIf: (s) => live(s) && s.sound,
    },

    {
        key: 'headline', type: 'toggle', tab: 'fonts', section: 'Headline',
        label: 'Show the headline', showIf: live,
        hint: 'The name set across the wallpaper. The photo never carries it.',
    },
    {
        key: 'headlineScale', type: 'range', tab: 'fonts', section: 'Headline', label: 'Headline size',
        min: 0.6, max: 1.4, step: 0.05, unit: '×', precision: 2,
        showIf: (s) => live(s) && s.headline,
    },
]

export default DEFAULTS
