import { registerSW } from 'virtual:pwa-register'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // <--- ESTA LÍNEA ES VITAL

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
})

import { CurrencyProvider } from './context/CurrencyContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </React.StrictMode>
)