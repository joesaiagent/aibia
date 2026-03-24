import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import './index.css'
import App from './App'
import Landing from './pages/Landing'
import Upgrade from './pages/Upgrade'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import AgentRun from './pages/AgentRun'
import Leads from './pages/Leads'
import Inbox from './pages/Inbox'
import Social from './pages/Social'
import Approvals from './pages/Approvals'
import Settings from './pages/Settings'
import client, { setAuthUserId } from './api/client'

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

function ProtectedApp() {
  const { user, isLoaded } = useUser()
  const [subStatus, setSubStatus] = useState<'loading' | 'active' | 'inactive'>('loading')

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { setSubStatus('inactive'); return }

    setAuthUserId(user.id)

    // Handle post-checkout redirect — give webhook a moment to process
    const params = new URLSearchParams(window.location.search)
    const isCheckoutSuccess = params.get('checkout') === 'success'

    const checkStatus = async (retries = 0) => {
      try {
        const res = await client.get('/stripe/subscription/status')
        const status = res.data.status
        if ((status === 'active' || status === 'trialing')) {
          setSubStatus('active')
        } else if (isCheckoutSuccess && retries < 5) {
          // Webhook may not have fired yet — retry up to 5 times
          setTimeout(() => checkStatus(retries + 1), 2000)
        } else {
          setSubStatus('inactive')
        }
      } catch {
        setSubStatus('inactive')
      }
    }

    checkStatus()
  }, [user, isLoaded])

  if (!isLoaded || subStatus === 'loading') {
    return <div style={{ minHeight: '100vh', background: '#0a0a0a' }} />
  }

  return (
    <>
      <SignedIn>
        {subStatus === 'active'
          ? <RouterProvider router={router} />
          : <Upgrade />
        }
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
