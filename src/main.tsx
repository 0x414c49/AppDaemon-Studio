import React from 'react'
import ReactDOM from 'react-dom/client'

import '@fontsource/fira-code/400.css'
import '@fontsource/fira-code/500.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/cascadia-code/400.css'
import '@fontsource/cascadia-code/500.css'

import './app/globals.css'
import { ToastProvider } from './app/components/Toast'
import Home from './app/page'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <Home />
    </ToastProvider>
  </React.StrictMode>
)
