import React from 'react'
import './spotify.scss'

// Mounted lazily by the window manager — the iframe (and its cookies) only
// load once the window has actually been opened.
const Spotify = () => (
  <div className="spotifyWindow">
    <iframe
      title="Spotify playlist"
      src="https://open.spotify.com/embed/playlist/3wP61raRvSMfNW6iKiGLIF?utm_source=generator"
      width="100%"
      height="100%"
      style={{ borderRadius: '12px' }}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      loading="lazy"
    />
  </div>
)

export default Spotify
