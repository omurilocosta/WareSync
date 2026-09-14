import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'

import './styles/dash.css'
import './styles/toast.css'
import './styles/vars.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider >
    </BrowserRouter>
  </StrictMode>,
)
