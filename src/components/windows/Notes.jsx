import React, { useEffect, useState } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import Markdown from 'react-markdown'
import MacWindow from './MacWindow';
import './notes.scss'
const Notes = ({ windowsState, windowName, setWindowsState   }) => {
    const [markdown, setMarkdown] = useState(null);
    useEffect(() => {
        fetch('note.txt')
            .then(response => response.text())
            .then(text => setMarkdown(text));
    })
    return (
        <MacWindow height='40vh' width='30vw' x='1000' y='600' windowName={windowName} windowsState={windowsState} setWindowsState={setWindowsState}>
            <div className="noteWindow">
                {markdown ? <SyntaxHighlighter language='typescript'style={atomOneDark} >{markdown}</SyntaxHighlighter> : <p>Loading...</p>}
            </div>
        </MacWindow>
    )
}

export default Notes
