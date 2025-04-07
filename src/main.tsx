import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { DaptinInitializer } from '@/daptinInitializer.tsx'
import { useAuthStore } from '@/stores/authStore'
import { handleServerError } from '@/utils/handle-server-error'
import { toast } from '@/hooks/use-toast'
import ErrorBoundary from './components/ui/error-boundary'
import { FontProvider } from './context/font-context'
import { ThemeProvider } from './context/theme-context'
import './index.css'
// Generated Routes
import { routeTree } from './routeTree.gen'

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
            search: { redirect: currentPath },
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

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <DaptinInitializer>
      <StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
              <FontProvider>
                <AuthInitializer />
                <TokenExpirationChecker />
                <RouterProvider router={router} />
              </FontProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </StrictMode>
    </DaptinInitializer>
  )
}
