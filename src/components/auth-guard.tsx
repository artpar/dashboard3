import { useEffect } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/stores/authStore'
import { toast } from '@/hooks/use-toast'

interface AuthGuardProps {
  children: React.ReactNode
}

// Function to check if token is expired
const isTokenExpired = (user: any) => {
  if (!user || !user.exp) return true
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000)
  return user.exp < currentTime
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if not authenticated or token is expired
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login page with return URL
        navigate({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      } else if (isTokenExpired(user)) {
        // Handle expired token
        toast({
          variant: 'destructive',
          title: 'Session expired!',
          description: 'Please sign in again to continue.',
        })
        
        logout().then(() => {
          navigate({
            to: '/sign-in',
            search: { redirect: location.href },
          })
        })
      }
    }
  }, [isAuthenticated, isLoading, user, logout, navigate, location])

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>
  }

  // If authenticated and token is not expired, render children
  return isAuthenticated && !isTokenExpired(user) ? <>{children}</> : null
}
