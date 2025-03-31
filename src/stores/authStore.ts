import { create } from 'zustand'
import { sendMessageToBackgroundScript } from '../background'

// Define types for the Daptin auth user
interface DaptinUser {
  id: string
  email: string
  exp: number
  name: string
  roles: string[]
}

interface Customer {
  reference_id: string
  [key: string]: any
}

interface Creator {
  reference_id: string
  [key: string]: any
}

interface AuthState {
  user: DaptinUser | null
  token: string | null
  customer: Customer | null
  creator: Creator | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Auth actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getAuthState: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  customer: null,
  creator: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await sendMessageToBackgroundScript({
        type: 'signIn',
        email,
        password,
      })

      // Get the updated auth state after login
      await get().getAuthState()

      set({ isLoading: false })
    } catch (error) {
      console.error('Login error:', error)

      // Handle structured error responses from the API
      if (error && typeof error === 'object') {
        if (error.message) {
          set({
            isLoading: false,
            error: error.message,
          })
          return
        }
      }

      // Fallback for other types of errors
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to login',
      })
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true })

      await sendMessageToBackgroundScript({
        type: 'signOut',
      })

      set({
        user: null,
        token: null,
        customer: null,
        creator: null,
        isAuthenticated: false,
        isLoading: false,
      })
    } catch (error) {
      console.error('Logout error:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to logout',
      })
    }
  },

  getAuthState: async () => {
    try {
      set({ isLoading: true })

      const authData = await sendMessageToBackgroundScript({
        type: 'getAuth',
      })

      if (authData && authData.token && authData.user) {
        set({
          user: authData.user,
          token: authData.token,
          customer: authData.customer || null,
          creator: authData.creator || null,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({
          user: null,
          token: null,
          customer: null,
          creator: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Error getting auth state:', error)
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to get auth state',
      })
    }
  },
}))

// Hook for easier access to auth state and actions
export const useAuth = () => useAuthStore()
