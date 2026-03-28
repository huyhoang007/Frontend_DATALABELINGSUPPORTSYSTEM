import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Agentation } from 'agentation'
import App from './App.jsx'
import './index.css'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { queryClient } from './query/queryClient'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <>
            <App />
            {import.meta.env.DEV && <Agentation />}
          </>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
