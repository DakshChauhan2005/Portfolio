import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Deliberately no <StrictMode>: its double-invoked effects interfere with the
// window manager and the terminal emulator.
createRoot(document.getElementById('root')).render(
    <ErrorBoundary label="The desktop">
        <App />
    </ErrorBoundary>
)
