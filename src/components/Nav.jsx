import React from 'react'
import { asset } from '../utils/asset'
import "./nav.scss"
import AnimationSettings from './AnimationSettings'
import DateTime from './DateTime'

/**
 * The menu bar. `animation` is the window-animation editor's whole interface —
 * its open state plus the settings it edits — bundled into one prop rather than
 * six, since the bar itself has no use for any of it beyond passing it on.
 *
 * The panel is a child of `<nav>` on purpose: it hangs off the bar the way a
 * real menu does (`top: 100%` in the stylesheet), and inherits the bar's
 * z-index, which already outranks the windows and the dock.
 */
const Nav = ({ mobile = false, animation }) => {
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
                {animation && (
                    <button
                        type="button"
                        className="nav-settings-button"
                        onClick={animation.onToggle}
                        aria-expanded={animation.open}
                        aria-label="Window animation settings"
                        title="Window animation"
                    >
                        {/* Inline rather than another file in public/: it is two
                            paths, and a menu-bar icon shouldn't cost a request. */}
                        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
                            <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                                <path d="M2 4.5h5M10 4.5h4M2 11.5h4M9 11.5h5" />
                                <circle cx="8.5" cy="4.5" r="1.8" />
                                <circle cx="7.5" cy="11.5" r="1.8" />
                            </g>
                        </svg>
                    </button>
                )}
                <div className="nav-icon">
                    <img src={asset('/navbar-icons/wifi.svg')} alt="" aria-hidden="true" />
                </div>
                <div className="nav-item">
                    <DateTime compact={mobile} />
                </div>
            </div>

            {animation?.open && (
                <AnimationSettings
                    settings={animation.settings}
                    update={animation.update}
                    reset={animation.reset}
                    onReplay={animation.onReplay}
                    onClose={animation.onToggle}
                />
            )}
        </nav>
    )
}

export default Nav
