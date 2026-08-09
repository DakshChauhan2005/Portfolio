import React, { useEffect, useRef } from 'react'
import { CONTROLS, EFFECTS } from '../data/windowAnimation'
import './animationSettings.scss'

/** `1.25` with precision 2 and unit `×` reads as `1.25×`; `260` reads as `260ms`. */
const readout = (control, value) =>
    `${Number(value).toFixed(control.precision ?? 0)}${control.unit ?? ''}`

/**
 * One row of the form. Every branch produces a real labelled control — the
 * segments are `<button aria-pressed>`, not styled divs — so the panel is
 * operable from the keyboard like the rest of the desktop.
 */
const Field = ({ control, settings, update }) => {
    const id = `anim-${control.key}`
    const value = settings[control.key]
    const hint = control.hint && <p className="hint">{control.hint}</p>

    if (control.type === 'segment') {
        return (
            <div className="field">
                <span className="label" id={`${id}-label`}>{control.label}</span>
                <div className="segment" role="group" aria-labelledby={`${id}-label`}>
                    {control.options.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            className={option.value === value ? 'on' : undefined}
                            aria-pressed={option.value === value}
                            title={option.hint}
                            onClick={() => update(control.key, option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                {hint}
            </div>
        )
    }

    if (control.type === 'select') {
        return (
            <div className="field">
                <label className="label" htmlFor={id}>{control.label}</label>
                <select id={id} value={value} onChange={(e) => update(control.key, e.target.value)}>
                    {control.options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                {hint}
            </div>
        )
    }

    if (control.type === 'toggle') {
        return (
            <div className="field">
                <label className="check" htmlFor={id}>
                    <input
                        id={id}
                        type="checkbox"
                        checked={value}
                        onChange={(e) => update(control.key, e.target.checked)}
                    />
                    <span>{control.label}</span>
                </label>
                {hint}
            </div>
        )
    }

    return (
        <div className="field">
            <label className="label row" htmlFor={id}>
                {control.label}
                <output htmlFor={id}>{readout(control, value)}</output>
            </label>
            <input
                id={id}
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={value}
                onChange={(e) => update(control.key, Number(e.target.value))}
            />
            {hint}
        </div>
    )
}

/**
 * The window animation's editor: a floating panel, opened from the menu bar,
 * that writes straight into the settings the engine reads.
 *
 * It renders itself entirely from `CONTROLS` in `src/data/windowAnimation.js`,
 * grouped by that list's `section` field. Nothing here knows what a genie is —
 * adding, removing or re-ordering a knob is an edit to that file alone.
 */
const AnimationSettings = ({ settings, update, reset, onReplay, onClose }) => {
    const panelRef = useRef(null)

    // Take focus on open, or the panel is unreachable without tabbing through
    // the whole menu bar. Esc is handled in App, alongside the window Esc.
    useEffect(() => {
        panelRef.current?.focus({ preventScroll: true })
    }, [])

    const visible = CONTROLS.filter(control => !control.showIf || control.showIf(settings))
    const active = EFFECTS.find(effect => effect.value === settings.effect)

    // Consecutive controls sharing a section render under one heading; the
    // schema's order is the panel's order.
    const sections = []
    for (const control of visible) {
        const last = sections[sections.length - 1]
        if (last && last.name === control.section) last.controls.push(control)
        else sections.push({ name: control.section, controls: [control] })
    }

    return (
        <aside
            className="anim-settings"
            ref={panelRef}
            role="dialog"
            aria-label="Window animation settings"
            tabIndex={-1}
        >
            <header>
                <h2>Window animation</h2>
                <button type="button" className="dismiss" onClick={onClose} aria-label="Close settings">
                    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            </header>

            <p className="lede">
                {active?.hint} Applies to opening and closing only — minimise and
                restore are untouched.
            </p>

            {sections.map(section => (
                <section key={`${section.name}-${section.controls[0].key}`}>
                    <h3>{section.name}</h3>
                    {section.controls.map(control => (
                        <Field key={control.key} control={control} settings={settings} update={update} />
                    ))}
                </section>
            ))}

            <footer>
                <button type="button" onClick={onReplay}>Replay</button>
                <button type="button" onClick={reset}>Reset</button>
            </footer>
        </aside>
    )
}

export default AnimationSettings
