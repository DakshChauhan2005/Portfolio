
import { useState } from "react"
import "./app.scss"
import Dock from "./components/Dock"
import Nav from "./components/Nav"
import Cli from "./components/windows/Cli"
import Github from "./components/windows/Github"
import MacWindow from "./components/windows/MacWindow"
import Notes from "./components/windows/Notes"
import Resume from "./components/windows/Resume"
import Spotify from "./components/windows/Spotify"

function App() {
  const [windowsState, setWindowsState] = useState({
    cli: false,
    github: false,
    notes: false,
    resume: false,
    spotify: false
  })

  return (
    <main>
      <Nav />
      <Dock windowsState={windowsState} setWindowsState={setWindowsState} />
      {windowsState.github && <Github />}
      {windowsState.notes && <Notes />}
      {windowsState.resume && <Resume />}
      {windowsState.spotify && <Spotify />}
      {windowsState.cli && <Cli />}
    </main>
  )
}

export default App
