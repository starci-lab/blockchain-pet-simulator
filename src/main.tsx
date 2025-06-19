import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './demo/index.css'
import App from './demo/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
