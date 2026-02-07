import { registerSW } from 'virtual:pwa-register'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // <--- ESTA LÍNEA ES VITAL

// Register service worker
const updateSW = registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('SW Registered:', r);
  },
  onRegisterError(error) {
    console.error('SW Registration Error:', error);
  },
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
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