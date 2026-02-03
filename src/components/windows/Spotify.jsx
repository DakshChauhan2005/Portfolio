import React from 'react'
import MacWindow from './MacWindow'
import './spotify.scss'



const Spotify = () => {
  return (
    <MacWindow width="20vw" height="45vh" x="1350" y="100">
        <div className="spotifyWindow">
            <iframe data-testid="embed-iframe" style={{borderRadius:"12px"}} src="https://open.spotify.com/embed/playlist/3wP61raRvSMfNW6iKiGLIF?utm_source=generator" width="100%"  frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>
    </MacWindow>
  )
}

export default Spotify
