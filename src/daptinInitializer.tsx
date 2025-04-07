// Create a component to initialize daptin client
import { useEffect, useState } from 'react'
import { initializeDaptinClient } from '@/background.ts'
import { Loader2 } from 'lucide-react'

export function DaptinInitializer({ children }: { children: React.ReactNode }) {
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
        <div className='max-w-md rounded-lg bg-red-50 p-6 dark:bg-red-900/20'>
          <h2 className='mb-2 text-xl font-bold text-red-700 dark:text-red-400'>
            Initialization Error
          </h2>
          <p className='text-red-600 dark:text-red-300'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700'
          >
            Retry
          </button>
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
