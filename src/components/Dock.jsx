import React from 'react'
import registry from './windows/registry'
import { contact } from '../data/profile'
import { asset } from '../utils/asset'
import "./dock.scss"

const byId = Object.fromEntries(registry.map(w => [w.id, w]))

/**
 * Dock order, interleaving windows with the plain external links. Window
 * entries render from the registry; link entries are self-contained.
 */
const LAYOUT = [
  { kind: 'window', id: 'github' },
  { kind: 'window', id: 'notes' },
  { kind: 'window', id: 'resume' },
  {
    kind: 'link', id: 'calender', className: 'calender', label: 'Calendar',
    icon: asset('/doc-icons/calender.svg'), href: 'https://calendar.google.com/calendar',
  },
  { kind: 'window', id: 'spotify' },
  {
    kind: 'link', id: 'mail', className: 'mail', label: 'Email me',
    icon: asset('/doc-icons/mail.svg'), href: `mailto:${contact.email}`, sameTab: true,
  },
  {
    kind: 'link', id: 'linkedin', className: 'link', label: 'LinkedIn',
    icon: asset('/doc-icons/link.svg'), href: contact.linkedin,
  },
  {
    kind: 'link', id: 'leetcode', className: 'leetcode', label: 'LeetCode',
    icon: asset('/doc-icons/leetcode.svg'), href: contact.leetcode,
  },
  { kind: 'window', id: 'cli' },
]

export default function Dock({ dockRef, wm }) {
  return (
    <footer className='dock' ref={dockRef} aria-label='Dock'>
      {LAYOUT.map(item => {
        if (item.kind === 'link') {
          // A real anchor rather than window.open: it is keyboard-operable,
          // middle-clickable, and shows its destination on hover. External
          // targets always carry noopener/noreferrer.
          return (
            <a
              key={item.id}
              className={`icon ${item.className}`}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              {...(item.sameTab ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            >
              <img src={item.icon} alt="" aria-hidden="true" />
            </a>
          )
        }

        const def = byId[item.id]
        const state = wm.windows[def.id]
        return (
          <button
            key={def.id}
            type="button"
            className={`icon ${def.dockClass}${state.open ? ' running' : ''}`}
            // The open/close animation flies to and from this icon, and looks it
            // up by id: the dock's order is LAYOUT's, not the registry's, so an
            // index into either one would be a trap the first time LAYOUT moves.
            data-window-id={def.id}
            title={def.title}
            // The icon is the only visible label, so it has to be spoken.
            aria-label={state.open ? `${def.title} (open)` : `Open ${def.title}`}
            aria-pressed={state.open}
            // Launch, restore, raise, or hide — never close. Closing belongs to
            // the red button alone, which is how a dock is supposed to behave.
            onClick={() => wm.toggleFromDock(def.id)}
            // Start fetching the window's chunk on intent rather than on click,
            // so the Suspense fallback is never seen. `preload` memoises, and
            // pointerdown covers touch, where there is no hover.
            onPointerEnter={def.preload}
            onPointerDown={def.preload}
            onFocus={def.preload}
          >
            <img src={def.icon} alt="" aria-hidden="true" />
          </button>
        )
      })}
    </footer>
  )
}
