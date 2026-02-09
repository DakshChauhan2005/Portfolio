import React from 'react'
import MacWindow from './MacWindow'
import './resume.scss'
const Resume = ({ windowsState, windowName, setWindowsState   }) => {
  return (
    <MacWindow width="40vw" height="45vh" x="300" y="100" windowName={windowName} windowsState={windowsState} setWindowsState={setWindowsState}>
        <div className="resume-window">
            <embed src="resume.pdf" frameborder="0"></embed>
        </div>
    </MacWindow>
  )
}

export default Resume
