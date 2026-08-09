import React, { useCallback, useEffect, useRef } from 'react'
import { Rnd } from 'react-rnd'
import "./MacWindow.scss"

/**
 * The chrome shared by every window: title bar, traffic lights, drag and
 * resize. It renders whatever content the registry points at.
 *
 * Geometry is *controlled* — the manager owns x/y/width/height and this only
 * reports changes back. That's what makes maximize, restore, and surviving a
 * close/reopen possible.
 *
 * Below the mobile breakpoint the whole drag/resize layer is skipped: `mobile`
 * renders a plain full-screen frame instead of an `Rnd`, since dragging a
 * window around a 375px screen is meaningless.
 *
 * `frameRef` hands the inner `.window` element out to the open/close animation.
 * It is that element and not the `Rnd` wrapper because react-rnd drives the
 * wrapper's own `transform` to position it — writing to that would fight the
 * drag layer.
 */
const MacWindow = ({
    title,
    geometry,
    z,
    hidden,
    maximized,
    mobile,
    frameRef,
    onFocus,
    onClose,
    onMinimize,
    onToggleMaximize,
    onGeometry,
    children,
}) => {
    const localRef = useRef(null)

    // A callback ref rather than a forwarded object ref: this element is wanted
    // in two places at once — the focus effect below and the animation engine.
    const setFrame = useCallback((el) => {
        localRef.current = el
        frameRef?.(el)
    }, [frameRef])

    /**
     * Move keyboard focus into a window when it becomes visible — otherwise a
     * dock click leaves the caret on the dock and the window is unreachable
     * except by tabbing backwards through the whole page.
     *
     * The `contains` guard means content that focuses itself keeps focus.
     */
    useEffect(() => {
        if (hidden) return
        const frame = localRef.current
        if (!frame || frame.contains(document.activeElement)) return
        frame.focus({ preventScroll: true })
    }, [hidden])

    // Clicking a traffic light must not also start a drag.
    const swallow = (e) => e.stopPropagation()

    const frame = (
        <section
            className="window"
            ref={setFrame}
            role="dialog"
            aria-label={title}
            // Focusable but not in the tab order: the window is reached by
            // opening it, not by tabbing past every other window's contents.
            tabIndex={-1}
        >
            <div className="titlebar" onDoubleClick={mobile ? undefined : onToggleMaximize}>
                <div className="dots" onMouseDown={swallow} onDoubleClick={swallow}>
                    <button
                        type="button"
                        className="dot red"
                        onClick={onClose}
                        aria-label={`Close ${title}`}
                        title="Close"
                    />
                    <button
                        type="button"
                        className="dot yellow"
                        onClick={onMinimize}
                        aria-label={`Minimise ${title}`}
                        title="Minimise"
                    />
                    {/* Zoom is meaningless when the window already fills the screen. */}
                    {!mobile && (
                        <button
                            type="button"
                            className="dot green"
                            onClick={onToggleMaximize}
                            aria-label={`${maximized ? 'Restore' : 'Zoom'} ${title}`}
                            title={maximized ? 'Restore' : 'Zoom'}
                        />
                    )}
                </div>
                <h2 className="tittle">{title}</h2>
            </div>
            <div className="main-content">
                {children}
            </div>
        </section>
    )

    if (mobile) {
        return (
            <div
                className="mobile-window"
                style={{ zIndex: z, display: hidden ? 'none' : undefined }}
            >
                {frame}
            </div>
        )
    }

    return (
        <Rnd
            size={{ width: geometry.width, height: geometry.height }}
            position={{ x: geometry.x, y: geometry.y }}
            onDragStart={onFocus}
            onDragStop={(e, d) => onGeometry({ ...geometry, x: d.x, y: d.y })}
            onResizeStart={onFocus}
            onResizeStop={(e, dir, ref, delta, pos) => onGeometry({
                width: ref.offsetWidth,
                height: ref.offsetHeight,
                x: pos.x,
                y: pos.y,
            })}
            bounds="parent"
            minWidth={320}
            minHeight={200}
            dragHandleClassName="titlebar"
            disableDragging={maximized}
            enableResizing={!maximized}
            style={{ zIndex: z, display: hidden ? 'none' : undefined }}
            onMouseDown={onFocus}
        >
            {frame}
        </Rnd>
    )
}

export default MacWindow
