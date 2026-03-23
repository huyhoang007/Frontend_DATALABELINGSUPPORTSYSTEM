import React from 'react'
import ReactDOM from 'react-dom/client'
import { Agentation } from 'agentation'
import App from './App.jsx'
import './index.css'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <>
          <App />
          {import.meta.env.DEV && <Agentation />}
        </>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>,
)
