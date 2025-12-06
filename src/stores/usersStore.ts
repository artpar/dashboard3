// src/stores/usersStore.ts
import { create } from 'zustand';
import { daptinClient } from '../daptin';
import { User, userListSchema } from '../features/users/data/schema';
import { validateDaptinResponse } from '@/lib/utils';


interface UsersState {
  users: User[]
  isLoading: boolean
  error: string | null

  // User actions
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
    try {
      set({ isLoading: true, error: null })

      const response = await daptinClient.jsonApi.findAll('user_account', {
        'page[size]': '100',
        'page[number]': 1,
        sort: '-created_at',
      })

      validateDaptinResponse(response, 'Failed to fetch users')

      // Transform the API response to match our User schema
      const transformedUsers = response.data.map((user: any) => ({
        id: user.id,
        name: user.name || '',
        email: user.email,
        status: user.confirmed ? 'active' : 'inactive',
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      }))

      // Validate the transformed data with our schema
      const validatedUsers = userListSchema.parse(transformedUsers)

      set({ users: validatedUsers, isLoading: false })
    } catch (error) {
      console.error('Fetch users error:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      })
    }
  },

  createUser: async (userData) => {
    try {
      set({ isLoading: true, error: null })

      // Map the user data to the format expected by the API
      const apiUserData = {
        name: userData.name,
        email: userData.email,
        confirmed: userData.status === 'active',
        ...(userData.password ? { password: userData.password } : {})
      }

      const response = await daptinClient.jsonApi.create('user_account', apiUserData)
      validateDaptinResponse(response, 'Failed to create user')

      // Refresh the user list
      await useUsersStore.getState().fetchUsers()

      set({ isLoading: false })
    } catch (error) {
      console.error('Create user error:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      })
      throw error; // Re-throw to allow handling in the UI
    }
  },

  updateUser: async (id, userData) => {
    try {
      set({ isLoading: true, error: null })

      // First, fetch the current user data to ensure we have the latest
      const currentUserResponse = await daptinClient.jsonApi.find('user_account', id)
      validateDaptinResponse(currentUserResponse, 'Failed to fetch user data')
      const currentUser = currentUserResponse.data

      // Prepare update data
      const updateData: Record<string, any> = {}

      // Only update fields that have changed
      if (userData.name !== undefined) {
        const name = userData.name !== undefined ? userData.name : currentUser.name?.split(' ')[0] || ''
        updateData.name = `${name}`.trim()
      }

      if (userData.email !== undefined) updateData.email = userData.email
      if (userData.status !== undefined) updateData.confirmed = userData.status === 'active'
      if (userData.password) updateData.password = userData.password

      // If no fields to update, return early
      if (Object.keys(updateData).length === 0) {
        set({ isLoading: false })
        return
      }

      // Make the API call to update the user
      const response = await daptinClient.jsonApi.update('user_account', {
        id: id,
        ...updateData
      })
      validateDaptinResponse(response, 'Failed to update user')

      // Refresh the user list to get the updated data
      await useUsersStore.getState().fetchUsers()

      set({ isLoading: false })
    } catch (error) {
      console.error('Update user error:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      })
      throw error; // Re-throw to allow handling in the UI
    }
  },

  deleteUser: async (id) => {
    try {
      set({ isLoading: true, error: null })

      // First, check if the user exists
      const userResponse = await daptinClient.jsonApi.find('user_account', id)
      validateDaptinResponse(userResponse, 'User not found')

      // Proceed with deletion
      const response = await daptinClient.jsonApi.destroy('user_account', id)
      validateDaptinResponse(response, 'Failed to delete user')

      // Update the local state by removing the deleted user
      set((state) => ({
        users: state.users.filter(user => user.id !== id),
        isLoading: false
      }))

      // No need to fetch all users again, we've already updated the state
      // This makes the UI more responsive

    } catch (error) {
      console.error('Delete user error:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      })
      throw error; // Re-throw to allow handling in the UI
    }
  },
}))

// Helper function to map role to permissions
function getPermissionsForRole(role: string): string[] {
  switch (role) {
    case 'superadmin':
      return ['superadmin', 'admin', 'manager', 'user'];
    case 'admin':
      return ['admin', 'manager', 'user'];
    case 'manager':
      return ['manager', 'user'];
    case 'cashier':
      return ['cashier', 'user'];
    default:
      return ['user'];
  }
}

// Hook for easier access to users state and actions
export const useUsers = () => useUsersStore()
