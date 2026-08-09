# Portfolio — a macOS desktop in the browser

Personal portfolio of **Daksh Chauhan**, full-stack developer. Instead of a
scrolling page, the whole site is a fake desktop: a menu bar, a dock, and
draggable, resizable windows you open like apps.

> **TODO(screenshot):** add `docs/screenshot.png` and embed it here — a
> portfolio README should show the thing before it describes it.

## Apps

| Window | What it is |
|---|---|
| **Github** | Featured projects as cards — stack, repo, and live demo where one exists |
| **Notes** | Skills, rendered as a syntax-highlighted config file |
| **Resume** | The resume PDF, embedded |
| **Terminal** | A real command interpreter — `about`, `projects`, `skills`, `contact`, `open <window>` |
| **Spotify** | An embedded playlist, because a desktop should have some personality |

The dock also links out to email, LinkedIn, and Google Calendar.

## Stack

- **React 19** + **Vite 7**
- **SCSS** — plain per-component stylesheets, no CSS modules, no utility framework
- **react-rnd** — window drag and resize
- **react-console-emulator** — the terminal
- **react-syntax-highlighter** — the Notes window

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
public/            wallpaper (2400px + 1200px), icons, resume.pdf,
                   note.txt (the Notes window's content)
src/
  data/            profile.js, projects.js  ← single source of truth for content
  hooks/
    useWindowManager.js   open/close/focus/minimise/maximise + geometry
    useIsMobile.js        the 768px breakpoint, in one place
  components/
    Nav.jsx        menu bar
    Dock.jsx       launcher
    ErrorBoundary.jsx     contains a throw to one window
    windows/
      registry.js  every window declared once
      MacWindow.jsx       shared chrome (drag/resize, traffic lights)
      Github.jsx, Notes.jsx, Resume.jsx, Spotify.jsx, Cli.jsx
  App.jsx          renders the registry through MacWindow
```

**Content lives in `src/data/`, not in components.** Both the Github window and
the terminal read from `projects.js`, so a project is described once. `note.txt`
is the exception — the Notes window renders it verbatim, and it mirrors the
`skills` export in `profile.js`.

### Adding a window

Add one entry to `src/components/windows/registry.js`:

```js
{
    id: 'notes',
    title: 'Skills',
    icon: '/doc-icons/note.svg',
    dockClass: 'note',
    ...chunk(() => import('./Notes')),
    defaultSize: { width: 520, height: 460 },
}
```

That is the whole change — `App` renders from the registry and `Dock` builds its
icons from it. Optionally add the id to `LAYOUT` in `Dock.jsx` to choose where
its icon sits. The component returns its *content* only; the frame, title bar
and traffic lights come from `MacWindow`.

## Performance

Every window is a separate chunk, loaded on first open (or by an idle-time
prefetch after the desktop has painted), so the first paint carries only the
shell — **80 kB gzipped**, down from 390 kB. The syntax highlighter uses the
`light` build with TypeScript as the only registered language. Phones get a
1200px wallpaper instead of the 2400px one.

## Roadmap

Content, the window manager, mobile and accessibility, and performance are
done. Still open: deploy config with SPA rewrites, CI running lint and build on
PR, a custom domain, and a Lighthouse pass.


## License

MIT
