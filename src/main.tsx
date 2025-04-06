import { StrictMode, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { handleServerError } from '@/utils/handle-server-error'
import { toast } from '@/hooks/use-toast'
import { FontProvider } from './context/font-context'
import { ThemeProvider } from './context/theme-context'
import './index.css'
// Generated Routes
import { routeTree } from './routeTree.gen'
import ErrorBoundary from './components/ui/error-boundary'
import { initializeDaptinClient } from './background'
import { Loader2 } from 'lucide-react'

// Create a component to initialize auth state
function AuthInitializer() {
  const { getAuthState } = useAuthStore()

  useEffect(() => {
    // Initialize auth state when the app loads
    getAuthState()
  }, [getAuthState])

  return null
}

// Function to check if token is expired
const isTokenExpired = (user: any) => {
  if (!user || !user.exp) return true

  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000)
  return user.exp < currentTime
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast({
              variant: 'destructive',
              title: 'Content not modified!',
            })
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast({
            variant: 'destructive',
            title: 'Session expired!',
            description: 'Please sign in again to continue.',
          })
          // Properly access the logout function from the store
          const authStore = useAuthStore.getState()
          authStore.logout().then(() => {
            const redirect = `${router.history.location.href}`
            router.navigate({ to: '/sign-in', search: { redirect } })
          })
        }
        if (error.response?.status === 500) {
          toast({
            variant: 'destructive',
            title: 'Internal Server Error!',
          })
          router.navigate({ to: '/500' })
        }
        if (error.response?.status === 403) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access this resource.',
          })
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Create a component to check token expiration periodically
function TokenExpirationChecker() {
  useEffect(() => {
    const checkTokenExpiration = () => {
      const authStore = useAuthStore.getState()
      const { user, isAuthenticated } = authStore

      if (isAuthenticated && isTokenExpired(user)) {
        toast({
          variant: 'destructive',
          title: 'Session expired!',
          description: 'Please sign in again to continue.',
        })

        authStore.logout().then(() => {
          const currentPath = router.history.location.href
          router.navigate({
            to: '/sign-in',
            search: { redirect: currentPath }
          })
        })
      }
    }

    // Check on mount
    checkTokenExpiration()

    // Set up interval to check periodically (every minute)
    const interval = setInterval(checkTokenExpiration, 60000)

    return () => clearInterval(interval)
  }, [])

  return null
}

// Create a component to initialize daptin client
function DaptinInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        const success = await initializeDaptinClient()
        if (success) {
          setIsInitialized(true)
        } else {
          setError('Failed to initialize Daptin client')
        }
      } catch (err) {
        console.error('Error initializing Daptin client:', err)
        setError('An unexpected error occurred while initializing Daptin client')
      }
    }

    initialize()
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Initialization Error</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Initializing application...</p>
      </div>
    )
  }

  return <>{children}</>
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <DaptinInitializer>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
              <FontProvider>
                <AuthInitializer />
                <TokenExpirationChecker />
                <RouterProvider router={router} />
              </FontProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </DaptinInitializer>
      </ErrorBoundary>
    </StrictMode>
  )
}
