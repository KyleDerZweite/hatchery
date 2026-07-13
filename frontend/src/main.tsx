import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider, fetchAuthConfig } from './lib/auth'
import { ToastProvider } from './components/ui/use-toast'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

const root = createRoot(document.getElementById('root')!)

// The backend decides the auth mode, so it must answer before anything renders.
try {
  const config = await fetchAuthConfig()
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider config={config}>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
} catch {
  root.render(
    <p role="alert" className="flex h-screen items-center justify-center">
      Cannot reach the Hatchery API. Is the backend running?
    </p>,
  )
}
