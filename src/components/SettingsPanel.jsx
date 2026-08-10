import { useEffect, useRef, useState } from 'react'
import { CONTROLS as DESKTOP_CONTROLS } from '../data/desktop'
import { DISPLAY_FONTS, UI_FONTS, ensureDisplayFonts } from '../data/fonts'
import { WALLPAPERS } from '../data/wallpapers'
import { CONTROLS as ANIMATION_CONTROLS, EFFECTS } from '../data/windowAnimation'
import { clearTrack, setTrack } from '../utils/trackStore'
import SettingsField from './SettingsField'
import './settingsPanel.scss'

/**
 * Group a control list into sections for rendering: a control whose `showIf`
 * says it can't affect anything is dropped, and consecutive entries naming the
 * same section share one heading. The schema's order is the panel's order.
 */
const sectionsOf = (controls, settings) => {
    const sections = []
    for (const control of controls) {
        if (control.showIf && !control.showIf(settings)) continue
        const last = sections[sections.length - 1]
        if (last && last.name === control.section) last.controls.push(control)
        else sections.push({ name: control.section, controls: [control] })
    }
    return sections
}

/**
 * System Settings: one panel, opened from the menu bar, holding everything the
 * visitor is allowed to change about the desktop.
 *
 * Three tabs, because there are three unrelated things to set and stacking them
 * in one column made a panel taller than the screen:
 *
 *   Wallpaper  which one is up, how much it moves, whether it makes a sound
 *   Fonts      the interface face, and the face the wallpaper's headline is set in
 *   Window     the open/close animation — this used to be the whole panel
 *
 * Everything except the three pickers and the vinyl track row is rendered from
 * a CONTROLS schema (`data/desktop.js` and `data/windowAnimation.js`) through
 * `SettingsField`. The pickers are hand-written because each one has to
 * *preview* what it selects — a wallpaper as its own gradient, a typeface set
 * in itself — and the track row because a schema describes numbers, toggles and
 * enums, and its value is a file.
 *
 * Reset belongs to whichever schema the visible tab edits, so resetting the
 * animation can't silently throw away a chosen wallpaper.
 */

const TABS = [
    { id: 'wallpaper', label: 'Wallpaper' },
    { id: 'fonts', label: 'Fonts' },
    { id: 'window', label: 'Window' },
]

/** The wallpaper grid: every scene as its own gradient plus its motif on top. */
const WallpaperPicker = ({ value, onPick }) => (
    <div className="wallpaper-grid" role="group" aria-label="Wallpaper">
        {WALLPAPERS.map(paper => (
            <button
                key={paper.id}
                type="button"
                className={`paper${paper.id === value ? ' on' : ''}`}
                aria-pressed={paper.id === value}
                onClick={() => onPick(paper.id)}
            >
                <span className="tile" style={{ background: paper.swatch }}>
                    <span className="motif" style={{ background: paper.motif }} />
                </span>
                <span className="meta">
                    <span className="name">
                        <span className="dot" style={{ background: paper.dot }} />
                        {paper.name}
                    </span>
                    <span className="hint">{paper.hint}</span>
                </span>
            </button>
        ))}
    </div>
)

/**
 * Big enough that a phone on a slow connection would notice, small enough that
 * a whole side of an album fits at a sane bitrate. Nothing is uploaded, so this
 * is about the visitor's own memory, not about bandwidth.
 */
const MAX_TRACK = 25 * 1024 * 1024

/**
 * The record on the Vinyl Hour turntable — the only setting whose value is a
 * *file*. It goes to IndexedDB (`utils/trackStore.js`) and the settings object
 * keeps just its name, which is why this is hand-written rather than a CONTROLS
 * entry: the schema describes numbers, toggles and enums, and a Blob is none of
 * those.
 *
 * Shown only while Vinyl Hour is the wallpaper that is up, because it means
 * nothing under any of the other seven.
 */
const TrackPicker = ({ name, onPick, onClear }) => {
    const fileRef = useRef(null)
    const [note, setNote] = useState(null)

    const choose = async (event) => {
        const file = event.target.files?.[0]
        // Cleared straight away so that picking the *same* file again after a
        // Remove still fires a change event — the input keeps its value
        // otherwise, and the second pick would silently do nothing.
        event.target.value = ''
        if (!file) return
        if (!file.type.startsWith('audio/')) {
            setNote('That does not look like an audio file.')
            return
        }
        if (file.size > MAX_TRACK) {
            setNote(`Too big — ${Math.round(MAX_TRACK / 1024 / 1024)} MB is the limit.`)
            return
        }
        const kept = await setTrack(file)
        onPick(file.name)
        // A browser in private mode takes the file but cannot keep it. Say so,
        // rather than letting the track quietly vanish on the next reload.
        setNote(kept ? null : 'Playing — but this browser will not remember it after a reload.')
    }

    const remove = () => {
        clearTrack()
        onClear()
        setNote(null)
    }

    return (
        <section>
            <h3>The record</h3>
            <div className="track">
                <p className="now">{name || 'The bundled track'}</p>
                {name && <button type="button" onClick={remove}>Remove</button>}
                <button type="button" onClick={() => fileRef.current?.click()}>
                    {name ? 'Replace' : 'Choose'}
                </button>
                {/* `hidden`, and opened by the real button beside it: a file
                    input cannot be restyled, and this keeps one control in the
                    tab order instead of two. */}
                <input ref={fileRef} type="file" accept="audio/*" onChange={choose} hidden />
            </div>
            {note && <p className="hint" role="status">{note}</p>}
            <p className="hint">
                Plays under the crackle while the needle is down — click empty
                desktop to lift it, and drag the cursor across to slow the
                platter. Your file stays in this browser and is never uploaded.
            </p>
        </section>
    )
}

const SettingsPanel = ({ desktop, animation, onClose }) => {
    const panelRef = useRef(null)
    const tabsRef = useRef(null)
    const [tab, setTab] = useState('wallpaper')

    // Take focus on open, or the panel is unreachable without tabbing through
    // the whole menu bar. Esc is handled in App, alongside the window Esc.
    useEffect(() => {
        panelRef.current?.focus({ preventScroll: true })
    }, [])

    // The Fonts tab previews each display face in itself, so it needs the
    // webfonts even when the headline is switched off and nothing else has
    // asked for them. `ensureDisplayFonts` memoises, so this is usually a no-op.
    useEffect(() => {
        if (tab === 'fonts') ensureDisplayFonts()
    }, [tab])

    // Left/right move between tabs, as a tablist is expected to.
    const onTabKeyDown = (event) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
        if (!step) return
        event.preventDefault()
        const next = TABS[(TABS.findIndex(t => t.id === tab) + step + TABS.length) % TABS.length]
        setTab(next.id)
        // Focus follows selection, which is how an automatic tablist behaves.
        tabsRef.current?.querySelector(`#settings-tab-${next.id}`)?.focus()
    }

    const ds = desktop.settings
    const effect = EFFECTS.find(e => e.value === animation.settings.effect)

    const desktopSections = (name) =>
        sectionsOf(DESKTOP_CONTROLS.filter(c => c.tab === name), ds).map(section => (
            <section key={`${section.name}-${section.controls[0].key}`}>
                <h3>{section.name}</h3>
                {section.controls.map(control => (
                    <SettingsField
                        key={control.key}
                        control={control}
                        settings={ds}
                        update={desktop.update}
                        idPrefix="desktop"
                    />
                ))}
            </section>
        ))

    return (
        <aside
            className="settings-panel"
            ref={panelRef}
            role="dialog"
            aria-label="Desktop settings"
            tabIndex={-1}
        >
            <header>
                <h2>Settings</h2>
                <button type="button" className="dismiss" onClick={onClose} aria-label="Close settings">
                    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            </header>

            <div className="tabs" role="tablist" aria-label="Settings sections" ref={tabsRef} onKeyDown={onTabKeyDown}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        id={`settings-tab-${t.id}`}
                        type="button"
                        role="tab"
                        aria-selected={t.id === tab}
                        aria-controls={`settings-panel-${t.id}`}
                        tabIndex={t.id === tab ? 0 : -1}
                        className={t.id === tab ? 'on' : undefined}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'wallpaper' && (
                <div className="tab-panel" id="settings-panel-wallpaper" role="tabpanel" aria-labelledby="settings-tab-wallpaper">
                    <p className="lede">
                        Every wallpaper is drawn frame by frame and answers the cursor
                        — move it over empty desktop, and click.
                    </p>
                    <WallpaperPicker value={ds.wallpaper} onPick={(id) => desktop.update('wallpaper', id)} />
                    {desktopSections('wallpaper')}
                    {ds.wallpaper === 'vinyl' && (
                        <TrackPicker
                            name={ds.trackName}
                            onPick={(name) => desktop.update('trackName', name)}
                            onClear={() => desktop.update('trackName', '')}
                        />
                    )}
                </div>
            )}

            {tab === 'fonts' && (
                <div className="tab-panel" id="settings-panel-fonts" role="tabpanel" aria-labelledby="settings-tab-fonts">
                    <section>
                        <h3>Interface</h3>
                        <div className="font-list" role="group" aria-label="Interface font">
                            {UI_FONTS.map(font => (
                                <button
                                    key={font.id}
                                    type="button"
                                    className={`face${font.id === ds.uiFont ? ' on' : ''}`}
                                    aria-pressed={font.id === ds.uiFont}
                                    style={{ fontFamily: font.stack }}
                                    onClick={() => desktop.update('uiFont', font.id)}
                                >
                                    <span className="sample">Ag</span>
                                    <span className="name">{font.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="hint">
                            Menu bar, dock and window chrome. All five are faces the
                            system already has, so switching costs nothing.
                        </p>
                    </section>

                    <section>
                        <h3>Headline face</h3>
                        <div className="font-list display" role="group" aria-label="Headline font">
                            {DISPLAY_FONTS.map(font => (
                                <button
                                    key={font.id}
                                    type="button"
                                    className={`face${font.id === ds.displayFont ? ' on' : ''}`}
                                    aria-pressed={font.id === ds.displayFont}
                                    onClick={() => desktop.update('displayFont', font.id)}
                                >
                                    <span
                                        className="sample"
                                        style={{
                                            fontFamily: font.line1.fontFamily,
                                            fontWeight: font.line1.fontWeight,
                                            fontStyle: font.line1.fontStyle,
                                        }}
                                    >
                                        {font.preview}
                                    </span>
                                    <span className="name">{font.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="hint">
                            The name drawn across the wallpaper. Hide it, or resize it,
                            below.
                        </p>
                    </section>

                    {desktopSections('fonts')}
                </div>
            )}

            {tab === 'window' && (
                <div className="tab-panel" id="settings-panel-window" role="tabpanel" aria-labelledby="settings-tab-window">
                    <p className="lede">
                        {effect?.hint} Applies to opening and closing only — minimise and
                        restore are untouched.
                    </p>
                    {sectionsOf(ANIMATION_CONTROLS, animation.settings).map(section => (
                        <section key={`${section.name}-${section.controls[0].key}`}>
                            <h3>{section.name}</h3>
                            {section.controls.map(control => (
                                <SettingsField
                                    key={control.key}
                                    control={control}
                                    settings={animation.settings}
                                    update={animation.update}
                                    idPrefix="anim"
                                />
                            ))}
                        </section>
                    ))}
                </div>
            )}

            <footer>
                {tab === 'window' && (
                    <button type="button" onClick={animation.onReplay}>Replay</button>
                )}
                <button
                    type="button"
                    // Resetting the desktop clears `trackName`, so the file it
                    // named has to go with it — otherwise the visitor's audio
                    // sits in IndexedDB with nothing left pointing at it.
                    onClick={tab === 'window'
                        ? animation.reset
                        : () => { clearTrack(); desktop.reset() }}
                >
                    {tab === 'window' ? 'Reset animation' : 'Reset desktop'}
                </button>
            </footer>
        </aside>
    )
}

export default SettingsPanel
