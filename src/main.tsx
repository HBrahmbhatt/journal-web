import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css"
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AppGate } from './AppGate.tsx'

createRoot(document.getElementById('root')!).render(
  // main.tsx
  <StrictMode>
    <AppGate>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppGate>
  </StrictMode>

)
