import React, { useEffect, useState } from 'react'
// The `light` build ships lowlight's core with *no* languages registered; the
// default entry point registers all 190-odd and was the single biggest thing in
// the bundle. Same for the style — the `styles/hljs` barrel pulls in every
// theme, so the one theme is imported by path.
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/light'
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import atomOneDark from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark'
import { asset } from '../../utils/asset'
import './notes.scss'

SyntaxHighlighter.registerLanguage('typescript', typescript)

const Notes = () => {
    const [markdown, setMarkdown] = useState(null)
    const [error, setError] = useState(null)

    // The empty dependency array matters: without it this refetched note.txt on
    // every render, which was an unbounded request loop.
    useEffect(() => {
        let cancelled = false
        fetch(asset('/note.txt'))
            .then(res => {
                if (!res.ok) throw new Error(`note.txt returned ${res.status}`)
                return res.text()
            })
            .then(text => { if (!cancelled) setMarkdown(text) })
            .catch(err => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [])

    return (
        <div className="noteWindow">
            {error
                ? <p className="note-error">Couldn't load skills: {error}</p>
                : markdown
                    ? <SyntaxHighlighter language='typescript' style={atomOneDark}>{markdown}</SyntaxHighlighter>
                    : <p>Loading…</p>}
        </div>
    )
}

export default Notes
