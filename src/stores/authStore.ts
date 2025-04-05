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
  authMethod: 'password' | 'otp' | null
  emailForOtp: string | null

  // Auth actions
  login: (email: string, password: string) => Promise<void>
  loginWithOtp: (email: string, otp: string) => Promise<void>
  requestOtp: (email: string) => Promise<void>
  logout: () => Promise<void>
  getAuthState: () => Promise<void>
  setAuthMethod: (method: 'password' | 'otp') => void
  setEmailForOtp: (email: string) => void
  signup: (name: string, email: string, password: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  customer: null,
  creator: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  authMethod: null,
  emailForOtp: null,

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

  loginWithOtp: async (email: string, otp: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await sendMessageToBackgroundScript({
        type: 'signInWithEmailOtp',
        email,
        otp,
      })

      // Get the updated auth state after login
      await get().getAuthState()

      set({ isLoading: false, emailForOtp: null })
    } catch (error) {
      console.error('OTP login error:', error)

      // Handle structured error responses from the API
      if (error && typeof error === 'object') {
        if (error.error || error.message) {
          set({
            isLoading: false,
            error: error.error || error.message,
          })
          return
        }
      }

      // Fallback for other types of errors
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to login with OTP',
      })
    }
  },

  requestOtp: async (email: string) => {
    try {
      set({ isLoading: true, error: null, emailForOtp: email })

      // Call the API to request an OTP
      await sendMessageToBackgroundScript({
        type: 'signInWithEmail',
        email,
      })

      set({ isLoading: false, authMethod: 'otp' })
      return Promise.resolve()
    } catch (error) {
      console.error('Request OTP error:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to request OTP',
      })
      return Promise.reject(error)
    }
  },

  signup: async (name: string, email: string, password: string) => {
    try {
      set({ isLoading: true, error: null })

      // Call the API to sign up
      await sendMessageToBackgroundScript({
        type: 'signUp',
        name,
        email,
        password,
      })

      // After successful signup, automatically log the user in
      await get().login(email, password)
      
      set({ isLoading: false })
    } catch (error) {
      console.error('Signup error:', error)
      
      // Handle structured error responses from the API
      if (error && typeof error === 'object') {
        if (error.error || error.message) {
          set({
            isLoading: false,
            error: error.error || error.message,
          })
          return
        }
      }
      
      // Fallback for other types of errors
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign up',
      })
    }
  },

  logout: async () => {
    console.log("Logout invoked")
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
        authMethod: null,
        emailForOtp: null,
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

  setAuthMethod: (method) => {
    set({ authMethod: method, error: null })
  },

  setEmailForOtp: (email) => {
    set({ emailForOtp: email })
  },
}))

// Hook for easier access to auth state and actions
export const useAuth = () => useAuthStore()
