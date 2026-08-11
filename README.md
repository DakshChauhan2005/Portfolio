# Portfolio — a macOS desktop in the browser

Personal portfolio of **Daksh Chauhan**, full-stack developer. Instead of a
scrolling page, the whole site is a fake desktop: it boots, it has a menu bar, a
dock, a live wallpaper that answers the cursor, and draggable, resizable windows
you open like apps.

**Live:** <https://dakshchauhan2005.github.io/Portfolio/>

![The desktop: the Skills and Terminal windows open over the Constellations
wallpaper, with the menu bar above and the dock below](docs/screenshot.png)

## Apps

Window titles are what the title bar says; the file is where it lives.

| Window | File | What it is |
|---|---|---|
| **Projects** | `Github.jsx` | Featured projects as cards — stack, repo, and live demo where one exists |
| **Skills** | `Notes.jsx` | Skills, rendered as a syntax-highlighted config file |
| **Resume** | `Resume.jsx` | The resume PDF, embedded |
| **Music** | `Spotify.jsx` | An embedded playlist, because a desktop should have some personality |
| **Terminal** | `Cli.jsx` | A real command interpreter |

The terminal knows `about`, `projects`, `project <id>`, `skills`, `contact`,
`resume`, `achievements`, `ls`, `open <window>`, `close <window>`, `whoami`,
`pwd`, `date`, `echo` and `exit`, plus `help` and `clear` from the emulator.
`experience` and `education` register themselves only once those arrays in
`profile.js` are filled — see [Content](#content).

The dock also links out to email, LinkedIn, and Google Calendar. So does the
left half of the menu bar, which carries GitHub, LinkedIn, Resume and Email as
real links — a visitor who never opens a window still leaves with the resume and
a way to make contact.

## The desktop

The frame around the apps is most of the work:

- **Boot sequence.** First load of a session plays a macOS cold boot — Apple
  logo over a progress bar, the twelve-language `hello` cycle, a flash, then the
  desktop. Session-scoped, so a refresh doesn't replay it. Tap or press a key to
  skip; `prefers-reduced-motion` gets a plain fade.
- **Eight live wallpapers.** Canvas scenes, not photographs: Dusk Motes, Rain on
  Glass, Night Ride, Coast Drive, Late Desk, Constellations, Slow Ink and Vinyl
  Hour. Each one reads the cursor and answers a click — the rain wipes, the
  stars pin, the needle lifts. Nothing goes through React state; the loop writes
  the canvas directly and stops when the tab is hidden.
- **Ambient sound.** Every scene has a voice, synthesised with the Web Audio API
  rather than shipped as audio, so the soundtrack costs essentially nothing.
  Off by default, toggled from the speaker in the menu bar. Vinyl Hour is the
  exception: it plays a real track (`public/audio/vinyl-hour.mp3`, not in the
  repo — drop one in), or one the visitor picks themselves, kept in IndexedDB
  and never uploaded.
- **A short tour.** Four cards play once after the boot, ringing the wallpaper,
  the dock, the settings gear and the sound button. Not a modal — the desktop
  stays live underneath, because the first card asks you to click it.
- **Settings**, from the menu bar: wallpaper and its motion and ambience, the
  interface and headline fonts, and the window open/close animation.
- **The genie animation.** Windows grow out of their dock icon and collapse back
  into it. Keyframes are sampled in JS because the effect needs two different
  easing curves inside one transform, which no single CSS timing function can
  express.
- **A greeting window.** Skills opens by itself once the intro finishes, so
  nobody lands on an empty desk — unless you beat the intro to the dock, or
  you're on a phone, where a window would cover the desktop you just booted.

Windows are mounted on first open and stay mounted, hidden, after a close — so
terminal history and scroll position survive, and the Spotify iframe and the PDF
never load unless asked for.

## Mobile and accessibility

Below 768px (`useIsMobile.js` owns the number) windows drop `react-rnd` and fill
the screen, only the frontmost one renders, and the dock becomes a full-width
tab bar sized so all eight icons fit a 390px phone. The wallpaper loop pauses
while a window is up, since a full-screen window is opaque anyway.

Dock entries are real `<button>`s and real `<a href>`s, traffic lights are
buttons with a 24px hit target around a 12px dot, each window is a
`role="dialog"` that takes focus when it opens, Esc closes the frontmost one,
and there is a single `:focus-visible` ring defined in `app.scss`. Each window's
content sits in its own error boundary, so a throw shows a labelled panel in
that frame and the rest of the desktop keeps working.

## Stack

- **React 19** + **Vite 7**
- **SCSS** — plain per-component stylesheets, no CSS modules, no utility framework
- **react-rnd** — window drag and resize
- **react-console-emulator** — the terminal
- **react-syntax-highlighter** — the Skills window

The wallpapers, their audio, and the boot sequence are hand-written canvas and
Web Audio — no animation or sound library.

## Running it

```bash
npm install
npm run dev      # dev server with HMR, http://localhost:5173
```

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # serve the built dist/
npm run lint     # eslint over the repo
```

There is no test suite in this project.

## Layout

```
index.html         metadata, OG tags; preloads nothing on purpose
vite.config.js     `base` — the subpath deploy; see Deploying
eslint.config.js
public/            icons, favicon, resume.pdf, note.txt (the Skills window's
                   content), mac-wallpaper.jpg (link previews only — the
                   desktop's own wallpaper is drawn, not loaded),
                   .nojekyll (stops Pages running the build through Jekyll)
src/
  main.jsx         mounts App, with a backstop error boundary
  data/            all copy and every settings schema — no strings in components
    profile.js, projects.js       content
    wallpapers.js                 the catalogue (entry bundle: small on purpose)
    wallpaperScenes.js            the eight scenes' drawing code
    wallpaperVoices.js            one Web Audio graph per scene
    desktop.js, windowAnimation.js, fonts.js, hints.js
  hooks/
    useWindowManager.js           open/close/focus/minimise/maximise + geometry
    useWindowAnimation.js         the genie open/close
    usePersistentSettings.js      storage + sanitiser, shared by the two below
    useDesktopSettings.js, useAnimationSettings.js
    useIsMobile.js                the 768px breakpoint, in one place
  components/
    Nav.jsx        menu bar — name, links, clock, sound, settings
    DateTime.jsx   the menu bar's clock
    Dock.jsx       launcher
    BootSequence.jsx      the cold-boot intro
    bootGate.js           the sessionStorage key that plays it once
    LiveWallpaper.jsx     the canvas loop
    DesktopHints.jsx      the four-card tour
    SettingsPanel.jsx, SettingsField.jsx
    ErrorBoundary.jsx     confines a throw to the one window it happened in
    windows/
      registry.js  every window declared once
      MacWindow.jsx       shared chrome (drag/resize, traffic lights)
      Github.jsx, Notes.jsx, Resume.jsx, Spotify.jsx, Cli.jsx
  utils/
    asset.js       every public/ path referenced from JS — see Deploying
    trackStore.js  the visitor's own vinyl track, in IndexedDB
  App.jsx          renders the registry through MacWindow
```

## Content

**Content lives in `src/data/`, not in components.** Both the Projects window
and the terminal read from `projects.js`, so a project is described once.
`note.txt` is the exception — the Skills window renders it verbatim, and it
mirrors the `skills` export in `profile.js`.

Nothing in `src/data/` may be placeholder text. `experience` and `education` in
`profile.js` are intentionally empty arrays, and the terminal hides those
commands while they are — an invented employer is worse than a missing command.

### Adding a window

Add one entry to `src/components/windows/registry.js`:

```js
{
    id: 'notes',
    title: 'Skills',
    icon: asset('/doc-icons/note.svg'),
    dockClass: 'note',
    ...chunk(() => import('./Notes')),
    defaultSize: { width: 520, height: 460 },
}
```

That is the whole change — `App` renders from the registry and `Dock` builds its
icons from it. Optionally add the id to `LAYOUT` in `Dock.jsx` to choose where
its icon sits. The component returns its *content* only; the frame, title bar
and traffic lights come from `MacWindow`.

The `asset()` call is not decoration. See [Deploying](#deploying).

## Performance

Every window is a separate chunk, loaded on first open (or by an idle-time
prefetch after the desktop has painted), so the first paint carries only the
shell — **88 kB gzipped**, down from 390 kB. Current build:

| Chunk | raw | gzip |
|---|---|---|
| entry (shell) | 280 kB | 88 kB |
| Skills (syntax highlighter) | 47 kB | 17 kB |
| Terminal | 39 kB | 12 kB |
| LiveWallpaper (all eight scenes + voices) | 26 kB | 9 kB |
| SettingsPanel | 8 kB | 3 kB |
| DesktopHints | 3 kB | 2 kB |

The syntax highlighter uses the `light` build with TypeScript as the only
registered language — the package root registers ~190 languages and every theme,
which was 870 kB of the old bundle. There is no wallpaper image to load: `body`
carries a CSS gradient copied from the default scene's own backdrop, so the
desktop is never black while the canvas chunk arrives, and `index.html` preloads
nothing. Display webfonts are fetched only if the headline is switched on.

If the entry chunk goes back over ~300 kB, something was pulled out of a lazy
chunk — the usual culprit is importing `wallpaperScenes.js` from anything the
entry reaches.

## Deploying

GitHub Pages, from `.github/workflows/deploy.yml` — lint, build, then
`actions/deploy-pages` on every push to `main`. One-time repo setup:
**Settings → Pages → Source: "GitHub Actions"**.

The site is served from a **subpath** (`/Portfolio/`), which is the one fact
that shapes the asset handling. Vite rewrites absolute URLs in `index.html` and
in CSS `url()`, but **not inside JS string literals** — so every `public/` path
referenced from JS goes through `asset()` in `src/utils/asset.js`. A bare
`'/doc-icons/github.svg'` works in dev and 404s in production.

Changing the deploy target needs no code edit:

```bash
BASE_PATH=/ npm run build     # custom domain, or a <user>.github.io repo
```

Two exceptions that are hardcoded absolute URLs and must be edited by hand: the
`og:image`/`twitter:image` and `og:url` in `index.html`. Scrapers don't resolve
relative paths.

## License

MIT — see [LICENSE](LICENSE).
