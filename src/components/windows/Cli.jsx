import React, { useEffect, useRef } from 'react'
import Terminal from 'react-console-emulator'
import { projects } from '../../data/projects'
import { profile, contact, skills, experience, education, achievements } from '../../data/profile'
import './cli.scss'

/** Friendlier names for `open`, resolved against the real window ids. */
const ALIASES = {
    projects: 'github',
    skills: 'notes',
    cv: 'resume',
    music: 'spotify',
}

const Cli = ({ wm, id, mobile = false }) => {
    const rootRef = useRef(null)
    const ids = Object.keys(wm.windows)

    // react-console-emulator renders its own <input> with no way to label it,
    // so a screen reader announces an unnamed text field. Patch the attribute
    // on the node it created.
    useEffect(() => {
        const input = rootRef.current?.querySelector('input')
        if (input) input.setAttribute('aria-label', 'Terminal input')
    }, [])
    const resolve = (name) => {
        const key = String(name ?? '').toLowerCase()
        const target = ALIASES[key] ?? key
        return ids.includes(target) ? target : null
    }

    const commands = {
        about: {
            description: 'Who I am',
            fn: () => `${profile.name} — ${profile.role}\n\n${profile.summary}`
        },
        projects: {
            description: 'List my featured projects',
            fn: () => [
                'Featured projects:',
                '',
                ...projects.map(p => `  ${p.id}. ${p.title}`),
                '',
                "Type 'project <number>' for details, or 'open projects' for the visual view."
            ].join('\n')
        },
        project: {
            description: 'Show details for one project',
            usage: 'project <number>',
            fn: (num) => {
                const p = projects.find(x => String(x.id) === String(num))
                if (!p) return `No project ${num ?? ''}. Run 'projects' to see the list.`
                return [
                    p.title,
                    '',
                    p.description,
                    '',
                    `Stack : ${p.tags.join(', ')}`,
                    `Repo  : ${p.repoLink}`,
                    p.demoLink ? `Demo  : ${p.demoLink}` : null,
                ].filter(Boolean).join('\n')
            }
        },
        skills: {
            description: 'List my technical skills',
            fn: () => Object.entries(skills)
                .map(([group, items]) => `${group}:\n  ${items.join(', ')}`)
                .join('\n\n')
        },
        contact: {
            description: 'How to reach me',
            fn: () => [
                `Email    : ${contact.email}`,
                `GitHub   : ${contact.github}`,
                `LinkedIn : ${contact.linkedin}`,
                `LeetCode : ${contact.leetcode}`,
                '',
                'Happy to talk about backend work, IoT, or anything half-built.'
            ].join('\n')
        },
        resume: {
            description: 'Open my resume',
            fn: () => {
                wm.open('resume')
                return 'Opening resume…'
            }
        },
        open: {
            description: `Open a window (${ids.join(', ')})`,
            usage: 'open <window>',
            fn: (name) => {
                const target = resolve(name)
                if (!target) return `Unknown window '${name ?? ''}'. Try: ${ids.join(', ')}`
                wm.open(target)
                return `Opening ${target}…`
            }
        },
        close: {
            description: 'Close a window',
            usage: 'close <window>',
            fn: (name) => {
                const target = resolve(name)
                if (!target) return `Unknown window '${name ?? ''}'. Try: ${ids.join(', ')}`
                wm.close(target)
                return `Closed ${target}.`
            }
        },
        ls: {
            description: 'List the apps on this desktop',
            fn: () => ids
                .map(k => (wm.windows[k].open ? `${k}*` : k))
                .join('  ') + '\n\n* = currently open'
        },
        whoami: {
            description: 'Show current user',
            fn: () => profile.name.toLowerCase().replace(/\s+/g, '')
        },
        pwd: {
            description: 'Print working directory',
            fn: () => '/home/daksh'
        },
        date: {
            description: 'Show current date',
            fn: () => new Date().toString()
        },
        echo: {
            description: 'Echo a passed string',
            usage: 'echo <string>',
            fn: (...args) => args.join(' ')
        },
        exit: {
            description: 'Close the terminal',
            fn: () => {
                wm.close(id)
                return 'Bye.'
            }
        },
    }

    // Only registered when the underlying data actually exists — an empty
    // section stays hidden rather than printing placeholder employers.
    if (achievements.length) {
        commands.achievements = {
            description: 'Hackathons and results',
            fn: () => achievements.map(a => `• ${a}`).join('\n')
        }
    }
    if (experience.length) {
        commands.experience = {
            description: 'Show work experience',
            fn: () => experience.map(e => [
                `${e.role} — ${e.org}  (${e.period})`,
                ...(e.points ?? []).map(pt => `  • ${pt}`)
            ].join('\n')).join('\n\n')
        }
    }
    if (education.length) {
        commands.education = {
            description: 'Show education background',
            fn: () => education.map(e => [
                `${e.degree} — ${e.institution}  (${e.period})`,
                ...(e.details ?? []).map(d => `  • ${d}`)
            ].join('\n')).join('\n\n')
        }
    }

    const listed = ['about', 'projects', 'skills', 'contact', 'resume', 'achievements', 'experience', 'education']
        .filter(name => name in commands)

    const welcomeMessage = [
        `${profile.name} — ${profile.role}`,
        '',
        'Try:',
        ...listed.map(name => `  ${name.padEnd(12)} ${commands[name].description}`),
        `  ${'open <win>'.padEnd(12)} Open a window from here`,
        '',
        'Built-ins: help, clear, exit',
    ].join('\n')

    // react-console-emulator styles itself inline, so its type size and padding
    // can only be reached through props — a stylesheet can't override them.
    // Its defaults (15px, 20px padding) wrap the welcome banner on a phone.
    const type = mobile ? { fontSize: '12px' } : {}

    return (
        <div className="cliWindow" ref={rootRef}>
            <Terminal
                commands={commands}
                welcomeMessage={welcomeMessage}
                // A 24-char prompt eats most of a phone's line width.
                promptLabel={mobile ? 'daksh:~$' : 'daksh@portfolio:~$'}
                promptLabelStyle={{ color: 'lightgreen', ...type }}
                contentStyle={{
                    // Output is emitted as plain text into a div, so HTML
                    // collapses the runs of spaces the welcome banner and the
                    // `skills`/`project` output use to line up their columns.
                    whiteSpace: 'pre-wrap',
                    ...(mobile ? { padding: '10px' } : {}),
                    ...type,
                }}
                inputTextStyle={type}
            />
        </div>
    )
}

export default Cli
