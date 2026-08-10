import { Suspense, lazy } from 'react'
import { asset } from '../utils/asset'
import "./nav.scss"
import DateTime from './DateTime'

/**
 * A chunk of its own: most visitors never open Settings, and the panel carries
 * the wallpaper catalogue, both font lists and both control schemas with it.
 * There is no fallback — the panel appears a frame later at worst, and an
 * empty box flashing under the menu bar would be worse than that.
 */
const SettingsPanel = lazy(() => import('./SettingsPanel'))

/**
 * A speaker, with or without its waves. Inline rather than another file in
 * public/: it is a handful of paths, and a menu-bar icon shouldn't cost a
 * request. The two states share the cone so only the waves change.
 */
const SoundIcon = ({ on }) => (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
        <path
            d="M7.4 2.6 4.3 5.2H2.2v5.6h2.1l3.1 2.6z"
            fill="currentColor"
        />
        {on ? (
            <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <path d="M10.2 5.6a3.4 3.4 0 0 1 0 4.8" />
                <path d="M12.3 3.6a6.3 6.3 0 0 1 0 8.8" />
            </g>
        ) : (
            <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M10.6 6.2 14 9.8M14 6.2l-3.4 3.6" />
            </g>
        )}
    </svg>
)

/**
 * The menu bar.
 *
 * `settings` is the whole System Settings interface — its open state plus both
 * the schemas it edits — bundled into one prop rather than eight, since the bar
 * itself has no use for any of it beyond passing it on. `sound` is separate
 * because the bar genuinely owns that control: it is a menu-bar toggle sitting
 * beside the Wi-Fi icon, exactly where a Mac puts its volume.
 *
 * The panel is a child of `<nav>` on purpose: it hangs off the bar the way a
 * real menu does (`top: 100%` in the stylesheet), and inherits the bar's
 * z-index, which already outranks the windows and the dock.
 */
const Nav = ({ mobile = false, settings, sound }) => {
    return (
        <nav aria-label="Menu bar">
            <div className="left">
                <div className="apple-icon">
                    <img src={asset('/navbar-icons/apple.svg')} alt="" aria-hidden="true" />
                </div>
                <div className="nav-item">
                    <p>Daksh Chauhan</p>
                </div>
                {/* Decorative menu titles — there is no menu behind them, and on
                    a phone they only crowd out the clock. */}
                {!mobile && (
                    <>
                        <div className="nav-item">
                            <p>File</p>
                        </div>
                        <div className="nav-item">
                            <p>Window</p>
                        </div>
                        <div className="nav-item">
                            <p>Terminal</p>
                        </div>
                    </>
                )}
            </div>

            <div className="right">
                {settings && (
                    <button
                        type="button"
                        className="nav-settings-button"
                        onClick={settings.onToggle}
                        aria-expanded={settings.open}
                        aria-label="Desktop settings"
                        title="Settings"
                    >
                        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
                            <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                                <path d="M2 4.5h5M10 4.5h4M2 11.5h4M9 11.5h5" />
                                <circle cx="8.5" cy="4.5" r="1.8" />
                                <circle cx="7.5" cy="11.5" r="1.8" />
                            </g>
                        </svg>
                    </button>
                )}

                {/* Beside the Wi-Fi icon, and its own control rather than a row
                    buried in the panel: muting is the one wallpaper setting
                    people reach for in a hurry. Every wallpaper has a voice, so
                    it is never a dead button. */}
                {sound && (
                    <button
                        type="button"
                        className="nav-sound-button"
                        onClick={sound.onToggle}
                        aria-pressed={sound.on}
                        aria-label={sound.on ? 'Mute ambient sound' : 'Unmute ambient sound'}
                        title={sound.on ? 'Mute ambient sound' : 'Unmute ambient sound'}
                    >
                        <SoundIcon on={sound.on} />
                    </button>
                )}

                <div className="nav-icon">
                    <img src={asset('/navbar-icons/wifi.svg')} alt="" aria-hidden="true" />
                </div>
                <div className="nav-item">
                    <DateTime compact={mobile} />
                </div>
            </div>

            {settings?.open && (
                <Suspense fallback={null}>
                    <SettingsPanel
                        desktop={settings.desktop}
                        animation={settings.animation}
                        onClose={settings.onToggle}
                    />
                </Suspense>
            )}
        </nav>
    )
}

export default Nav
