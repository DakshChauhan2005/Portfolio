/**
 * One row of a settings form, rendered from a CONTROLS entry.
 *
 * Shared by every tab of the panel: the desktop's schema in `data/desktop.js`
 * and the window animation's in `data/windowAnimation.js` describe their
 * controls the same way, so both render through this and neither needs a
 * component of its own.
 *
 * Every branch produces a real labelled control — the segments are
 * `<button aria-pressed>`, not styled divs — so the panel is operable from the
 * keyboard like the rest of the desktop.
 */

/** `1.25` with precision 2 and unit `×` reads as `1.25×`; `260` reads as `260ms`. */
const readout = (control, value) =>
    `${Number(value).toFixed(control.precision ?? 0)}${control.unit ?? ''}`

const SettingsField = ({ control, settings, update, idPrefix = 'set' }) => {
    const id = `${idPrefix}-${control.key}`
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

export default SettingsField
