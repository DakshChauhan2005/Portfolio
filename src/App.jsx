import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react"
import "./app.scss"
import BootSequence from "./components/BootSequence"
import { hasBooted } from "./components/bootGate"
import Dock from "./components/Dock"
import ErrorBoundary from "./components/ErrorBoundary"
import Nav from "./components/Nav"
import MacWindow from "./components/windows/MacWindow"
import registry, { preloadAll } from "./components/windows/registry"
import { getUiFont } from "./data/fonts"
import useAnimationSettings from "./hooks/useAnimationSettings"
import useDesktopSettings from "./hooks/useDesktopSettings"
import useIsMobile from "./hooks/useIsMobile"
import useWindowAnimation from "./hooks/useWindowAnimation"
import useWindowManager from "./hooks/useWindowManager"

/**
 * A chunk of its own, like the windows: the eight scenes, the Web Audio graph
 * and the display webfonts arrive after first paint rather than competing with
 * it. Until then the gradient `app.scss` paints on `body` — the default
 * scene's own backdrop — is what's on screen.
 */
const LiveWallpaper = lazy(() => import("./components/LiveWallpaper"))

/**
 * Also its own chunk, and one most sessions never reach for twice: the little
 * tour that plays once after the boot intro. Nothing else imports it.
 */
const DesktopHints = lazy(() => import("./components/DesktopHints"))

function App() {
  const desktopRef = useRef(null)
  const dockRef = useRef(null)
  const isMobile = useIsMobile()

  /**
   * The boot intro, once per browsing session: 'playing' while the desktop is
   * behind the black veil, 'revealing' while the menu bar and dock slide in
   * under the lifting veil, then 'off'. `bootScale` is the intro's timing
   * factor, handed to the CSS so the two entrances stay in step with it.
   */
  const [boot, setBoot] = useState(() => (hasBooted() ? 'off' : 'playing'))
  const [bootScale, setBootScale] = useState(1)

  /**
   * The tour follows the intro, so it plays exactly as often as the intro does
   * — once a session, and never on a reload. Deciding it here, off the *first*
   * boot state, is what keeps that true: `boot` is 'off' both after the intro
   * has played and when there was no intro to play, and only this tells them
   * apart.
   */
  const [hints, setHints] = useState(() => !hasBooted())
  const dismissHints = useCallback(() => setHints(false), [])

  const onBootReveal = useCallback((scale) => {
    setBootScale(scale)
    setBoot('revealing')
  }, [])
  const onBootFinish = useCallback(() => setBoot('off'), [])

  /**
   * The area a window may occupy: the desktop minus the dock sitting over its
   * bottom edge. Read live rather than stored, since it changes on resize.
   */
  const getDesktopRect = useCallback(() => {
    const el = desktopRef.current
    if (!el) return { width: 1024, height: 640 }
    const { width, height } = el.getBoundingClientRect()
    const dockReserve = dockRef.current ? dockRef.current.offsetHeight + 16 : 0
    return { width, height: Math.max(200, height - dockReserve) }
  }, [])

  const wm = useWindowManager(registry, getDesktopRect)
  const { refit, topmost } = wm

  /**
   * The open/close animation and the panel that edits it. The engine detects
   * opening on its own; closing it has to intercept, so `anim.close` is spliced
   * over the manager's own `close` and that composed manager is what everything
   * downstream — the traffic lights, Esc, the terminal's `close` and `exit` —
   * is handed. Nothing else has to know an animation exists.
   */
  const { settings, update, reset } = useAnimationSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)

  /**
   * The desktop's own settings — wallpaper, motion, ambient sound, typography.
   * Kept apart from the animation's so the panel's Reset button can belong to
   * whichever tab is showing.
   */
  const desktop = useDesktopSettings()

  /**
   * The chosen interface face, handed to the whole desktop as one custom
   * property. `app.scss` gives `--ui-font` a default on `:root` and every piece
   * of chrome resolves it from there, so nothing below has to be told about the
   * setting — and the boot sequence, which sits outside `<main>`, keeps the
   * stock macOS face whatever is chosen here.
   */
  const mainStyle = useMemo(
    () => ({ '--ui-font': getUiFont(desktop.settings.uiFont).stack }),
    [desktop.settings.uiFont],
  )

  const anim = useWindowAnimation({
    windows: wm.windows,
    settings,
    desktopRef,
    dockRef,
    close: wm.close,
    toggleFromDock: wm.toggleFromDock,
  })
  const closeWindow = anim.close
  const dwm = useMemo(
    () => ({ ...wm, close: closeWindow, toggleFromDock: anim.toggleFromDock }),
    [wm, closeWindow, anim.toggleFromDock],
  )

  useEffect(() => {
    window.addEventListener('resize', refit)
    return () => window.removeEventListener('resize', refit)
  }, [refit])

  /**
   * The panel's Replay button: play the current settings on a real window
   * without hunting for one in the dock. A window that is already up closes and
   * comes back, so both halves are shown, in order.
   */
  const replayTimer = useRef(null)
  const replay = useCallback(() => {
    const id = topmost ?? registry[0].id
    const state = wm.windows[id]
    clearTimeout(replayTimer.current)
    if (!state.open || state.minimized) {
      wm.open(id)
      return
    }
    closeWindow(id)
    const gap = settings.closeDuration / Math.max(0.25, settings.speed) + 300
    replayTimer.current = setTimeout(() => wm.open(id), gap)
  }, [topmost, wm, closeWindow, settings.closeDuration, settings.speed])

  useEffect(() => () => clearTimeout(replayTimer.current), [])

  /**
   * Each window is its own chunk, so the first paint carries only the shell.
   * Once the browser is idle, fetch the rest in the background — opening a
   * window then costs nothing, but none of it competed with first paint.
   * (Bound: an unbound `window.requestIdleCallback` throws in Safari.)
   */
  useEffect(() => {
    const idle = window.requestIdleCallback?.bind(window)
      ?? ((fn) => setTimeout(fn, 1500))
    const cancel = window.cancelIdleCallback?.bind(window) ?? clearTimeout
    const handle = idle(preloadAll, { timeout: 4000 })
    return () => cancel(handle)
  }, [])

  /**
   * Esc closes the frontmost window — the only keyboard route out of one,
   * since there is no Cmd+W a browser will let us have. The terminal's input
   * ignores Esc, so this still works while typing in it.
   *
   * Newest thing on screen wins, which is what Esc is expected to do: the
   * tour if it is still running, then the settings panel, then the frontmost
   * window.
   */
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (hints) {
        setHints(false)
        return
      }
      if (settingsOpen) {
        setSettingsOpen(false)
        return
      }
      if (topmost) closeWindow(topmost)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [topmost, closeWindow, settingsOpen, hints])

  return (
    <>
      {/* `inert` rather than a click-catching overlay: it also keeps the dock and
          the menu bar out of the tab order while they're invisible. Dropped the
          moment the reveal starts, so the desktop is usable as it arrives. */}
      <main
        className={boot === 'off' ? undefined : `booting${boot === 'revealing' ? ' revealing' : ''}`}
        style={boot === 'off' ? mainStyle : { ...mainStyle, '--boot-k': bootScale }}
        inert={boot === 'playing'}
      >
        {/* Under everything. No Suspense fallback: there is nothing sensible to
            show in a wallpaper's place, and the gradient on `body` is already
            painted while the chunk downloads. The boundary is `silent` for the
            same reason — a failed chunk leaves that gradient standing rather
            than papering the desktop with an alert. */}
        <ErrorBoundary label="Wallpaper" silent>
          <Suspense fallback={null}>
            <LiveWallpaper
              wallpaperId={desktop.settings.wallpaper}
              settings={desktop.settings}
              mobile={isMobile}
              // On a phone an open window fills the desktop and is opaque, so
              // every frame drawn behind it is spent on pixels nobody sees.
              paused={isMobile && topmost != null}
            />
          </Suspense>
        </ErrorBoundary>

        <Nav
          mobile={isMobile}
          settings={{
            open: settingsOpen,
            onToggle: () => setSettingsOpen(o => !o),
            desktop,
            animation: { settings, update, reset, onReplay: replay },
          }}
          sound={{
            on: desktop.settings.sound,
            onToggle: () => desktop.update('sound', !desktop.settings.sound),
          }}
        />

        <div className="desktop" ref={desktopRef}>
          {registry.map(def => {
            const state = wm.windows[def.id]
            // Never opened yet: nothing in the tree, so the Spotify iframe and the
            // resume PDF cost nothing until asked for. Once opened it stays
            // mounted, so terminal history and scroll survive a close.
            if (!state.mounted) return null

            const Content = def.component
            // On a phone every window fills the screen, so showing more than one
            // means stacking opaque full-screen panels. Only the frontmost shows;
            // the rest stay mounted behind it.
            const hidden = !state.open || state.minimized || (isMobile && def.id !== topmost)

            return (
              <MacWindow
                key={def.id}
                title={def.title}
                geometry={state.geometry}
                z={state.z}
                hidden={hidden}
                maximized={state.maximized}
                mobile={isMobile}
                frameRef={anim.bind(def.id)}
                onFocus={() => wm.focus(def.id)}
                onClose={() => closeWindow(def.id)}
                onMinimize={() => wm.minimize(def.id)}
                onToggleMaximize={() => wm.toggleMaximize(def.id)}
                onGeometry={(geometry) => wm.setGeometry(def.id, geometry)}
              >
                {/* Per-window, so one window throwing — or its chunk failing to
                    download — leaves the rest of the desktop usable. The boundary
                    wraps Suspense because a rejected lazy import surfaces as a
                    render error. */}
                <ErrorBoundary label={def.title} onClose={() => closeWindow(def.id)}>
                  <Suspense fallback={<div className="window-loading">Loading {def.title}…</div>}>
                    <Content wm={dwm} id={def.id} mobile={isMobile} />
                  </Suspense>
                </ErrorBoundary>
              </MacWindow>
            )
          })}
        </div>

        <Dock dockRef={dockRef} wm={dwm} />

        {/* The tour, once a session, straight after the intro. Mounted only
            once the desktop is fully revealed — it points at the menu bar and
            the dock, which are still sliding in before that — and inside
            <main> so it inherits the chosen interface face. */}
        {hints && boot === 'off' && (
          <ErrorBoundary label="Tour" silent>
            <Suspense fallback={null}>
              <DesktopHints mobile={isMobile} onDone={dismissHints} />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      {boot !== 'off' && (
        <BootSequence onReveal={onBootReveal} onFinish={onBootFinish} />
      )}
    </>
  )
}

export default App
