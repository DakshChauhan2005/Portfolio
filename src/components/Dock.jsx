import React from 'react'
import "./dock.scss"
export default function Dock({ windowsState, setWindowsState }) {
  const handleClick = (icon) => {
    switch (icon) {
      case 'github':
        setWindowsState({ ...windowsState, github: !windowsState.github })
        break;
      case 'note':
        setWindowsState({ ...windowsState, notes: !windowsState.notes })
        break;
      case 'pdf':
        setWindowsState({ ...windowsState, resume: !windowsState.resume })
        break;
      case 'spotify':
        setWindowsState({ ...windowsState, spotify: !windowsState.spotify })
        break;
      case 'cli':
        setWindowsState({ ...windowsState, cli: !windowsState.cli })
        break;
      default:
        break;
    }
  }
  return (
    <footer className='dock'>
      <div className="icon github" onClick={() => handleClick('github')}><img src="/doc-icons/github.svg" alt="" /></div>
      <div className="icon note" onClick={() => handleClick('note')}><img src="/doc-icons/note.svg" alt="" /></div>
      <div className="icon pdf" onClick={() => handleClick('pdf')}><img src="/doc-icons/pdf.svg" alt="" /></div>
      <div className="icon calender"><img src="/doc-icons/calender.svg" alt="" /></div>
      <div className="icon spotify" onClick={() => handleClick('spotify')}><img src="/doc-icons/spotify.svg" alt="" /></div>
      <div className="icon mail"><img src="/doc-icons/mail.svg" alt="" /></div>
      <div className="icon link"><img src="/doc-icons/link.svg" alt="" /></div>
      <div className="icon cli" onClick={() => handleClick('cli')}><img src="/doc-icons/cli.svg" alt="" /></div>
    </footer>
  )
}
