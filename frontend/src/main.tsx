import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { setAuthUserId } from './api/client'
import './index.css'
import App from './App'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import AgentRun from './pages/AgentRun'
import Leads from './pages/Leads'
import Inbox from './pages/Inbox'
import Social from './pages/Social'
import Approvals from './pages/Approvals'
import Settings from './pages/Settings'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'chat', element: <Chat /> },
      { path: 'agent', element: <AgentRun /> },
      { path: 'leads', element: <Leads /> },
      { path: 'inbox', element: <Inbox /> },
      { path: 'social', element: <Social /> },
      { path: 'approvals', element: <Approvals /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

function AuthSync() {
  const { user } = useUser()
  setAuthUserId(user?.id ?? null)
  return null
}

function ProtectedApp() {
  return (
    <>
      <AuthSync />
      <SignedIn>
        <RouterProvider router={router} />
      </SignedIn>
      <SignedOut>
        <Landing />
      </SignedOut>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ProtectedApp />
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
)
