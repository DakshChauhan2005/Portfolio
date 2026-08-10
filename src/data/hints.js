/**
 * The little tour that plays once a session, right after the boot intro.
 *
 * It exists because everything this desktop can do is hidden behind an icon:
 * the wallpaper answers the cursor, the menu bar hides a settings panel and a
 * mute button, and the dock is the only way into the windows. A visitor who
 * doesn't poke at them sees a static screenshot of a Mac.
 *
 * Copy lives here rather than in the component for the same reason the rest of
 * `src/data/` does — the words are the content, and the component is only the
 * thing that positions them.
 *
 *   id      React key, and nothing else
 *   target  CSS selector for the element the card points at, or null to sit in
 *           the middle of the screen with no ring. **A selector that matches
 *           nothing degrades to that centred form**, so a hint can never leave
 *           a ring floating around the top-left corner.
 *   place   which side of the target the card sits on: 'above' or 'below'
 *   radius  the ring's corner radius, to match what it is drawn around
 *
 * The order is the order a visitor's eye travels: what they are already looking
 * at, then the bar at the bottom, then the two controls at the top right.
 */

export const HINTS = [
    {
        id: 'wallpaper',
        target: null,
        title: 'The wallpaper is alive',
        body: 'Move the cursor across the empty desktop — then click it. Eight scenes, all drawn frame by frame in the browser.',
    },
    {
        id: 'dock',
        target: '.dock',
        place: 'above',
        radius: 20,
        title: 'The dock',
        body: 'Projects, notes, the résumé, music — and a terminal that actually answers. Windows drag, resize and stack.',
    },
    {
        id: 'settings',
        target: '.nav-settings-button',
        place: 'below',
        radius: 10,
        title: 'Settings',
        body: 'Change the wallpaper, the interface and headline typefaces, and the way windows open and close.',
    },
    {
        id: 'sound',
        target: '.nav-sound-button',
        place: 'below',
        radius: 10,
        title: 'Ambience',
        body: 'Every wallpaper has its own soundtrack, synthesised on the fly rather than downloaded. Off until you ask for it.',
    },
]

/** Delay before the first card, so the menu bar and dock have finished arriving. */
export const HINT_LEAD = 700

/** How long each card holds before the next one takes its place. */
export const HINT_HOLD = 3400

export default HINTS
