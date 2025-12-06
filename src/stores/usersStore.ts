import { create } from 'zustand'
import { daptinClient } from '../daptin'
import { User, userListSchema } from '../features/users/data/schema'
import { validateDaptinResponse } from '@/lib/utils'
import { extractErrorMessage } from './utils/asyncAction'

interface UsersState {
  users: User[]
  isLoading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateUser: (id: string, userData: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await daptinClient.jsonApi.findAll('user_account', {
        'page[size]': '100',
        'page[number]': 1,
        sort: '-created_at',
      })
      validateDaptinResponse(response, 'Failed to fetch users')

      const transformedUsers = response.data.map((user: any) => ({
        id: user.id,
        name: user.name || '',
        email: user.email,
        status: user.confirmed ? 'active' : 'inactive',
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      }))

      set({ users: userListSchema.parse(transformedUsers), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to fetch users') })
    }
  },

  createUser: async (userData) => {
    set({ isLoading: true, error: null })
    try {
      const apiUserData = {
        name: userData.name,
        email: userData.email,
        confirmed: userData.status === 'active',
        ...(userData.password ? { password: userData.password } : {}),
      }

      const response = await daptinClient.jsonApi.create('user_account', apiUserData)
      validateDaptinResponse(response, 'Failed to create user')
      await useUsersStore.getState().fetchUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to create user') })
      throw error
    }
  },

  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null })
    try {
      const currentUserResponse = await daptinClient.jsonApi.find('user_account', id)
      validateDaptinResponse(currentUserResponse, 'Failed to fetch user data')

      const updateData: Record<string, any> = {}
      if (userData.name !== undefined) {
        updateData.name = userData.name.trim()
      }
      if (userData.email !== undefined) updateData.email = userData.email
      if (userData.status !== undefined) updateData.confirmed = userData.status === 'active'
      if (userData.password) updateData.password = userData.password

      if (Object.keys(updateData).length === 0) {
        set({ isLoading: false })
        return
      }

      const response = await daptinClient.jsonApi.update('user_account', { id, ...updateData })
      validateDaptinResponse(response, 'Failed to update user')
      await useUsersStore.getState().fetchUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to update user') })
      throw error
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const userResponse = await daptinClient.jsonApi.find('user_account', id)
      validateDaptinResponse(userResponse, 'User not found')

      const response = await daptinClient.jsonApi.destroy('user_account', id)
      validateDaptinResponse(response, 'Failed to delete user')

      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to delete user') })
      throw error
    }
  },
}))

export const useUsers = () => useUsersStore()
