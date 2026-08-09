/**
 * The boot intro plays once per browsing session, not once per navigation.
 * Read by `App` (to decide whether to render it at all) and written by
 * `BootSequence` when it finishes, so the key lives here rather than in either.
 *
 * sessionStorage rather than localStorage: a returning visitor tomorrow should
 * see the intro again, someone who refreshed twice reading the terminal should
 * not. Both calls are guarded — private-mode Safari throws on access, and
 * replaying the intro is a far smaller problem than the desktop never showing.
 */
const KEY = 'hasBooted'

export const hasBooted = () => {
    try {
        return sessionStorage.getItem(KEY) === '1'
    } catch {
        return false
    }
}

export const markBooted = () => {
    try {
        sessionStorage.setItem(KEY, '1')
    } catch {
        // Nothing to do: the intro simply plays again next load.
    }
}
