import React from 'react'
import './errorBoundary.scss'

/**
 * Catches a render/lifecycle throw so it doesn't take the whole desktop with
 * it. There is no hook equivalent — a boundary has to be a class.
 *
 * `App` puts one around each window's content, so a broken window shows this
 * panel inside its own frame and every other window keeps working, and
 * `main.jsx` puts one around the app as the last line of defence for `Nav` and
 * `Dock`. Windows stay mounted forever once opened, so a throw would otherwise
 * be permanent for the session — hence the retry button, which remounts the
 * subtree by clearing the stored error.
 *
 *   label   what broke, shown in the heading (defaults to "This panel")
 *   onClose optional; renders a second button, used to close a dead window
 */
export default class ErrorBoundary extends React.Component {
    state = { error: null }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        // Nothing is watching in production, but a visitor who opens the
        // console — and future me — should see what actually happened.
        console.error(`[${this.props.label ?? 'app'}] render failed`, error, info)
    }

    render() {
        const { error } = this.state
        if (!error) return this.props.children

        return (
            <div className="error-boundary" role="alert">
                <h3>{this.props.label ?? 'This panel'} stopped working</h3>
                <p className="error-boundary__detail">{error.message || String(error)}</p>
                <div className="error-boundary__actions">
                    <button type="button" onClick={() => this.setState({ error: null })}>
                        Try again
                    </button>
                    {this.props.onClose && (
                        <button type="button" onClick={this.props.onClose}>
                            Close
                        </button>
                    )}
                </div>
            </div>
        )
    }
}
