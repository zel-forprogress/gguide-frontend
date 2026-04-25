import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LocaleProvider } from './i18n/LocaleProvider'
import { checkStoredTokenExpiration } from './utils/auth'

const initialAuthExpired = checkStoredTokenExpiration()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <BrowserRouter>
        <App initialAuthExpired={initialAuthExpired} />
      </BrowserRouter>
    </LocaleProvider>
  </StrictMode>,
)
