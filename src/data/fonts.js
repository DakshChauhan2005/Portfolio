/**
 * Typefaces the visitor can choose between, in two independent sets.
 *
 * DISPLAY_FONTS style the headline drawn over the wallpaper. They are web
 * fonts, so they cost a request — which is why `LiveWallpaper` is the only
 * thing that injects `GOOGLE_FONTS_HREF`, it lives in that lazy chunk, and it
 * is asked for only while the headline is switched on.
 *
 * UI_FONTS restyle the desktop itself — menu bar, dock, window chrome — and are
 * deliberately *system* stacks only. That setting applies on every wallpaper
 * including the default one, so it has to weigh nothing.
 *
 * Both are consumed by the Fonts tab of the settings panel, which renders each
 * option in its own face so the list is its own preview.
 */

/** Injected on demand by `ensureDisplayFonts` — never at import time. */
export const GOOGLE_FONTS_HREF =
    'https://fonts.googleapis.com/css2' +
    '?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400' +
    '&family=Caveat:wght@500;600;700' +
    '&family=Cinzel:wght@400;500' +
    '&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300' +
    '&family=Gilda+Display' +
    '&family=Instrument+Serif:ital@0;1' +
    '&family=Italiana' +
    '&family=Marcellus' +
    '&family=Pinyon+Script' +
    '&family=Playfair+Display:ital,wght@0,400;0,500;1,400' +
    '&display=swap'

/**
 * Add the display-font stylesheet to the document, once per page load.
 *
 * Called from two places, both of which mean "a display face is about to be
 * shown": `LiveWallpaper` drawing the headline, and the settings panel's Fonts
 * tab opening (its list previews each face in itself). It is off the critical
 * path either way — a request that waited for the wallpaper chunk can't hold up
 * first paint — which is the whole reason this isn't a `<link>` in index.html.
 */
export function ensureDisplayFonts() {
    if (typeof document === 'undefined') return
    if (document.getElementById('display-fonts')) return

    for (const href of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']) {
        const pre = document.createElement('link')
        pre.rel = 'preconnect'
        pre.href = href
        if (href.includes('gstatic')) pre.crossOrigin = 'anonymous'
        document.head.appendChild(pre)
    }

    const link = document.createElement('link')
    link.id = 'display-fonts'
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_HREF
    document.head.appendChild(link)
}

/**
 * The headline faces. `line1` and `line2` are React style objects for the two
 * lines of the headline; `fontSize` is left as a clamp() string so the panel's
 * size slider can multiply it — see `scaled()` below.
 */
export const DISPLAY_FONTS = [
    {
        id: 'script', label: 'Script', preview: 'Aa',
        line1: {
            fontFamily: "Caveat, 'Segoe Script', cursive", fontSize: 'clamp(56px,10.5vw,150px)',
            fontWeight: 700, lineHeight: 0.92, letterSpacing: '.005em', transform: 'rotate(-1.6deg)',
        },
        line2: {
            fontFamily: "Caveat, 'Segoe Script', cursive", fontSize: 'clamp(56px,10.5vw,150px)',
            fontWeight: 500, lineHeight: 0.92, letterSpacing: '.01em', marginTop: '.02em', transform: 'rotate(-.8deg)',
        },
    },
    {
        id: 'calligraphy', label: 'Calligraphy', preview: 'Aa',
        line1: {
            fontFamily: "'Pinyon Script', cursive", fontSize: 'clamp(54px,10.4vw,150px)',
            fontWeight: 400, lineHeight: 1, letterSpacing: '.004em',
        },
        line2: {
            fontFamily: "'Cormorant Garamond', ui-serif, Garamond, serif", fontSize: 'clamp(26px,4.4vw,60px)',
            fontWeight: 300, lineHeight: 1, letterSpacing: '.42em', textTransform: 'uppercase', marginTop: '.16em',
        },
    },
    {
        id: 'editorial', label: 'Editorial', preview: 'Aa',
        line1: {
            fontFamily: "'Instrument Serif', ui-serif, Georgia, serif", fontSize: 'clamp(50px,9.4vw,138px)',
            fontWeight: 400, lineHeight: 0.94, letterSpacing: '-.022em',
        },
        line2: {
            fontFamily: "'Instrument Serif', ui-serif, Georgia, serif", fontSize: 'clamp(50px,9.4vw,138px)',
            fontStyle: 'italic', lineHeight: 0.94, letterSpacing: '-.012em', marginTop: '.01em',
        },
    },
    {
        id: 'bodoni', label: 'Bodoni', preview: 'Aa',
        line1: {
            fontFamily: "'Bodoni Moda', ui-serif, Didot, Georgia, serif", fontSize: 'clamp(42px,8vw,116px)',
            fontWeight: 400, lineHeight: 1, letterSpacing: '-.012em',
        },
        line2: {
            fontFamily: "'Bodoni Moda', ui-serif, Didot, Georgia, serif", fontSize: 'clamp(42px,8vw,116px)',
            fontWeight: 400, fontStyle: 'italic', lineHeight: 1, letterSpacing: '.006em', marginTop: '.05em',
        },
    },
    {
        id: 'italiana', label: 'Italiana', preview: 'Aa',
        line1: {
            fontFamily: 'Italiana, ui-serif, Didot, serif', fontSize: 'clamp(48px,9.2vw,134px)',
            fontWeight: 400, lineHeight: 1, letterSpacing: '.045em',
        },
        line2: {
            fontFamily: 'Italiana, ui-serif, Didot, serif', fontSize: 'clamp(48px,9.2vw,134px)',
            lineHeight: 1, letterSpacing: '.19em', marginTop: '.06em',
        },
    },
    {
        id: 'playfair', label: 'Playfair', preview: 'Aa',
        line1: {
            fontFamily: "'Playfair Display', ui-serif, Georgia, serif", fontSize: 'clamp(44px,8.4vw,120px)',
            fontWeight: 500, lineHeight: 1, letterSpacing: '-.02em',
        },
        line2: {
            fontFamily: "'Playfair Display', ui-serif, Georgia, serif", fontSize: 'clamp(44px,8.4vw,120px)',
            fontWeight: 400, fontStyle: 'italic', lineHeight: 1, letterSpacing: '-.008em', marginTop: '.04em',
        },
    },
    {
        id: 'cinzel', label: 'Engraved', preview: 'Aa',
        line1: {
            fontFamily: 'Cinzel, ui-serif, Trajan, serif', fontSize: 'clamp(32px,6vw,84px)',
            fontWeight: 500, lineHeight: 1.14, letterSpacing: '.12em',
        },
        line2: {
            fontFamily: 'Cinzel, ui-serif, Trajan, serif', fontSize: 'clamp(32px,6vw,84px)',
            fontWeight: 400, lineHeight: 1.14, letterSpacing: '.3em', marginTop: '.16em',
        },
    },
    {
        id: 'marcellus', label: 'Marcellus', preview: 'Aa',
        line1: {
            fontFamily: 'Marcellus, ui-serif, Optima, serif', fontSize: 'clamp(44px,8.6vw,124px)',
            fontWeight: 400, lineHeight: 1.02, letterSpacing: '.012em',
        },
        line2: {
            fontFamily: "'Gilda Display', ui-serif, Georgia, serif", fontSize: 'clamp(44px,8.6vw,124px)',
            fontWeight: 400, lineHeight: 1.02, letterSpacing: '.06em', marginTop: '.06em',
        },
    },
    {
        id: 'garamond', label: 'Classic', preview: 'Aa',
        line1: {
            fontFamily: "'Cormorant Garamond', ui-serif, Garamond, serif", fontSize: 'clamp(50px,9.8vw,144px)',
            fontWeight: 400, lineHeight: 0.96, letterSpacing: '-.008em',
        },
        line2: {
            fontFamily: "'Cormorant Garamond', ui-serif, Garamond, serif", fontSize: 'clamp(50px,9.8vw,144px)',
            fontWeight: 300, fontStyle: 'italic', lineHeight: 0.96, letterSpacing: '.012em', marginTop: '.01em',
        },
    },
]

/**
 * The interface faces. System stacks only — no request, no layout shift, and
 * they work offline. The first entry is the stack the app has always used.
 */
export const UI_FONTS = [
    {
        id: 'system', label: 'System',
        stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    },
    {
        id: 'rounded', label: 'Rounded',
        stack: "ui-rounded, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', 'Segoe UI Variable Display', Nunito, system-ui, sans-serif",
    },
    {
        id: 'humanist', label: 'Humanist',
        stack: "Optima, Candara, 'Gill Sans', 'Gill Sans MT', 'Segoe UI', system-ui, sans-serif",
    },
    {
        id: 'serif', label: 'Serif',
        stack: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
    },
    {
        id: 'mono', label: 'Mono',
        stack: "ui-monospace, SFMono-Regular, 'Cascadia Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    },
]

const displayById = Object.fromEntries(DISPLAY_FONTS.map(f => [f.id, f]))
const uiById = Object.fromEntries(UI_FONTS.map(f => [f.id, f]))

export const displayFontIds = DISPLAY_FONTS.map(f => f.id)
export const uiFontIds = UI_FONTS.map(f => f.id)

export const getDisplayFont = (id) => displayById[id] ?? DISPLAY_FONTS[0]
export const getUiFont = (id) => uiById[id] ?? UI_FONTS[0]

/**
 * The same style object with its `fontSize` multiplied by `scale`. The size is
 * a clamp() with viewport units in it, so it can only be scaled in CSS — hence
 * the calc() rather than doing the arithmetic here.
 */
export const scaled = (style, scale) =>
    (scale === 1 ? style : { ...style, fontSize: `calc(${style.fontSize} * ${scale})` })
