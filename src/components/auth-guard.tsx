import { useEffect } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/stores/authStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page with return URL
      navigate({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
  }, [isAuthenticated, isLoading, navigate, location])

  // Show nothing while checking authentication
  if (isLoading) {
    return <div>Loading...</div>
  }

  // If authenticated, render children
  return isAuthenticated ? <>{children}</> : null
}
