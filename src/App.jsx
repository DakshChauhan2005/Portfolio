
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
      {windowsState.github && <Github windowName="github" windowsState={windowsState} setWindowsState={setWindowsState} />}
      {windowsState.notes && <Notes windowName="notes" windowsState={windowsState} setWindowsState={setWindowsState} />}
      {windowsState.resume && <Resume windowName="resume" windowsState={windowsState} setWindowsState={setWindowsState} />}
      {windowsState.spotify && <Spotify windowName="spotify" windowsState={windowsState} setWindowsState={setWindowsState} />}
      {windowsState.cli && <Cli windowName="cli" windowsState={windowsState} setWindowsState={setWindowsState} />}
    </main>
  )
}

export default App
