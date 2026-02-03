
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


  return (
    <main>
      <Nav/>
      <Dock/>
      <Github/>
      <Notes/>
      <Resume/>
      <Spotify/>
      <Cli />
    </main>
  )
}

export default App
