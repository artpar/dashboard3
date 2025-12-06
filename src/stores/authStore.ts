import { create } from 'zustand'
import { sendMessageToBackgroundScript } from '../background'
import { extractErrorMessage } from './utils/asyncAction'

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
    set({ isLoading: true, error: null })
    try {
      await sendMessageToBackgroundScript({ type: 'signIn', email, password })
      await get().getAuthState()
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to login') })
    }
  },

  loginWithOtp: async (email: string, otp: string) => {
    set({ isLoading: true, error: null })
    try {
      await sendMessageToBackgroundScript({ type: 'signInWithEmailOtp', email, otp })
      await get().getAuthState()
      set({ isLoading: false, emailForOtp: null })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to login with OTP') })
    }
  },

  requestOtp: async (email: string) => {
    set({ isLoading: true, error: null, emailForOtp: email })
    try {
      await sendMessageToBackgroundScript({ type: 'signInWithEmail', email })
      set({ isLoading: false, authMethod: 'otp' })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to request OTP') })
      throw error
    }
  },

  signup: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await sendMessageToBackgroundScript({ type: 'signUp', name, email, password })
      await get().login(email, password)
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to sign up') })
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await sendMessageToBackgroundScript({ type: 'signOut' })
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
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to logout') })
    }
  },

  getAuthState: async () => {
    set({ isLoading: true })
    try {
      const authData = await sendMessageToBackgroundScript({ type: 'getAuth' })
      if (authData?.token && authData?.user) {
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
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to get auth state') })
    }
  },

  setAuthMethod: (method) => set({ authMethod: method, error: null }),
  setEmailForOtp: (email) => set({ emailForOtp: email }),
}))

export const useAuth = () => useAuthStore()
