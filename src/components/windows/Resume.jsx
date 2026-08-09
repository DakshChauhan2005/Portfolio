import React from 'react'
import { asset } from '../../utils/asset'
import './resume.scss'

const RESUME_URL = asset('/resume.pdf')

const Resume = () => (
  <div className="resume-window">
    <object data={RESUME_URL} type="application/pdf" aria-label="Resume">
      {/* Most mobile browsers refuse to render an inline PDF; they get this. */}
      <div className="resume-fallback">
        <p>Your browser can't display the PDF inline.</p>
        <a href={RESUME_URL} target="_blank" rel="noopener noreferrer">Open resume in a new tab</a>
      </div>
    </object>
    <a className="resume-download" href={RESUME_URL} download>Download PDF</a>
  </div>
)

export default Resume
