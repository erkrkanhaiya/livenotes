import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { detectAndSetMode } from './utils/detectMode.ts'

// Detect and set mode (web vs extension) before rendering
detectAndSetMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
