/**
 * The wallpaper *catalogue* — everything the settings panel needs to offer a
 * choice, and nothing that draws.
 *
 * This file is deliberately data-only and tiny, because it is in the entry
 * bundle: the settings schema reads it for its enum, and the panel renders a
 * preview tile per entry. The eight scenes' drawing code — a few hundred lines
 * of canvas work — lives in `wallpaperScenes.js`, which only `LiveWallpaper`
 * imports and which therefore ships in that lazy chunk.
 *
 *   id      the key used everywhere, and the key into SCENE_ENGINES
 *   name    what the picker calls it
 *   hint    one line on what the cursor does to it
 *   swatch  CSS gradient for the picker tile
 *   motif   a second layer over the swatch, so the tile suggests the scene
 *   dot     the accent colour beside the name
 *
 * Every wallpaper here is live: the still photo the site used to ship was
 * removed, so there is no "is this one a canvas scene?" question left to ask
 * anywhere. The first entry is the default, and `app.scss` paints a matching
 * gradient on `body` so the desktop is never black while the scene's chunk
 * downloads.
 */

export const WALLPAPERS = [
    {
        id: 'dusk',
        name: 'Dusk Motes',
        hint: 'the cursor parts the dust',
        swatch: 'linear-gradient(168deg,#1d1a26,#54322e 70%,#7a4a30)',
        dot: '#e0925e',
        motif: 'radial-gradient(circle at 30% 60%,rgba(255,210,170,.28),transparent 45%),radial-gradient(circle at 72% 34%,rgba(255,180,130,.2),transparent 42%)',
    },
    {
        id: 'rain',
        name: 'Rain on Glass',
        hint: 'drag to wipe the pane · click for lightning',
        swatch: 'linear-gradient(180deg,#0a1018,#16242e)',
        dot: '#7ea6c4',
        motif: 'repeating-linear-gradient(104deg,rgba(190,220,255,.16) 0 1px,transparent 1px 9px)',
    },
    {
        id: 'ride',
        name: 'Night Ride',
        hint: 'the cursor is the throttle · click to twist it',
        swatch: 'linear-gradient(180deg,#120f1c,#33203a 65%,#4a2b3a)',
        dot: '#b26a8c',
        motif: 'radial-gradient(circle at 76% 26%,rgba(255,230,200,.3),transparent 26%),linear-gradient(180deg,transparent 62%,rgba(0,0,0,.5) 62%)',
    },
    {
        id: 'drive',
        name: 'Coast Drive',
        hint: 'steer with the cursor · click to flash the brakes',
        swatch: 'linear-gradient(180deg,#241531,#8a3d43 62%,#e29a58)',
        dot: '#e08a55',
        motif: 'radial-gradient(circle at 50% 78%,rgba(255,190,110,.5),transparent 40%),repeating-linear-gradient(180deg,transparent 0 7px,rgba(0,0,0,.28) 7px 10px)',
    },
    {
        id: 'desk',
        name: 'Late Desk',
        hint: 'the lamp follows you · click to cool the room',
        swatch: 'linear-gradient(160deg,#171208,#2e2015 70%,#191108)',
        dot: '#d9a05a',
        motif: 'radial-gradient(circle at 62% 46%,rgba(255,196,110,.34),transparent 44%)',
    },
    {
        id: 'stars',
        name: 'Constellations',
        hint: 'the cursor threads the stars · click to pin them',
        swatch: 'linear-gradient(180deg,#05070f,#0d1422)',
        dot: '#8fb0e0',
        motif: 'radial-gradient(circle at 24% 30%,rgba(255,255,255,.6) 0 1px,transparent 1px),radial-gradient(circle at 64% 62%,rgba(255,255,255,.5) 0 1px,transparent 1px),radial-gradient(circle at 82% 24%,rgba(255,255,255,.45) 0 1px,transparent 1px)',
    },
    {
        id: 'ink',
        name: 'Slow Ink',
        hint: 'drag to draw · click drops a ring',
        swatch: 'linear-gradient(150deg,#14161a,#232629)',
        dot: '#9aa4ad',
        motif: 'radial-gradient(circle at 50% 50%,transparent 24%,rgba(230,236,242,.18) 24.6%,transparent 26%),radial-gradient(circle at 50% 50%,transparent 38%,rgba(230,236,242,.1) 38.6%,transparent 40%)',
    },
    {
        id: 'vinyl',
        name: 'Vinyl Hour',
        hint: 'the cursor sets the spin · click lifts the needle',
        swatch: 'linear-gradient(150deg,#120e12,#2a1d22)',
        dot: '#c07a6a',
        motif: 'radial-gradient(circle at 50% 50%,rgba(220,150,120,.5) 0 8%,rgba(0,0,0,.6) 8% 42%,transparent 43%)',
    },
]

export const wallpaperIds = WALLPAPERS.map(w => w.id)

/** The one a fresh visitor gets, and the fallback for an unknown id. */
export const DEFAULT_WALLPAPER = WALLPAPERS[0].id

export default WALLPAPERS
