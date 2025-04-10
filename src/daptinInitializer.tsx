// Create a component to initialize daptin client
import { useEffect, useState } from 'react'
import { initializeDaptinClient } from '@/background.ts'
import { Loader2 } from 'lucide-react'

export function DaptinInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      // Check if we're already on the sign-in page to prevent redirect loops
      const isSignInPage = window.location.pathname === '/sign-in'

      try {
        const success = await initializeDaptinClient()
        if (success) {
          setIsInitialized(true)
        } else {
          // If we're already on the sign-in page, don't redirect again
          if (isSignInPage) {
            setIsInitialized(true)
            return
          }

          // Check if this is an auth error (most likely 403)
          const token = localStorage.getItem('token')
          if (!token) {
            // No token, redirect to sign-in
            console.log('No authentication token found, redirecting to sign-in')
            window.location.href = '/sign-in'
            return
          }

          // Clear token if it's invalid and redirect to sign-in
          localStorage.removeItem('token')
          localStorage.removeItem('DAPTIN')
          console.log('Authentication failed, redirecting to sign-in')
          window.location.href = '/sign-in'
        }
      } catch (err) {
        console.error('Error initializing Daptin client:', err)

        // If we're already on the sign-in page, just set initialized to true
        // to avoid redirect loops
        if (isSignInPage) {
          setIsInitialized(true)
          return
        }

        // Check if this is an auth error
        if (err?.response?.status === 403 || err?.message?.includes('403')) {
          // Clear token and redirect to sign-in
          localStorage.removeItem('token')
          localStorage.removeItem('DAPTIN')
          console.log('Authentication error (403), redirecting to sign-in')
          window.location.href = '/sign-in'
          return
        }

        // For other errors, show the error UI
        setError(
          'An unexpected error occurred while initializing Daptin client'
        )
      }
    }

    initialize()
  }, [])

  if (error) {
    return (
      <div className='flex h-screen flex-col items-center justify-center p-4'>
        <div className='max-w-md rounded-lg bg-red-50 p-6 dark:bg-red-900/20 flex flex-col space-y-4'>
          <h2 className='mb-2 text-xl font-bold text-red-700 dark:text-red-400'>
            Initialization Error
          </h2>
          <p className='text-red-600 dark:text-red-300'>{error}</p>
          <div className='flex flex-col space-y-2'>
            <button
              onClick={() => window.location.reload()}
              className='rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700'
            >
              Retry
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/sign-in';
              }}
              className='rounded bg-blue-800 px-4 py-2 text-white hover:bg-blue-700'
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className='flex h-screen flex-col items-center justify-center'>
        <Loader2 className='text-primary h-12 w-12 animate-spin' />
        <p className='mt-4 text-lg'>Initializing application...</p>
      </div>
    )
  }

  return <>{children}</>
}
