// src/stores/usersStore.ts
import { create } from 'zustand';
import { daptinClient } from '../daptin';
import { User, userListSchema } from '../features/users/data/schema';


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

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to fetch users')
      }

      // Transform the API response to match our User schema
      const transformedUsers = response.data.map((user: any) => ({
        id: user.id,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        username: user.username || user.email.split('@')[0],
        email: user.email,
        phoneNumber: user.phone_number || '',
        status: user.confirmed ? 'active' : 'inactive',
        role: user.permissions?.includes('admin') ? 'admin' : 'manager',
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
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email,
        username: userData.username,
        phone_number: userData.phoneNumber,
        confirmed: userData.status === 'active',
        ...(userData.password ? { password: userData.password } : {})
      }

      const response = await daptinClient.jsonApi.create('user_account', apiUserData)

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to create user')
      }

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

      if (currentUserResponse.errors && currentUserResponse.errors.length) {
        throw new Error(currentUserResponse.errors[0].detail || 'Failed to fetch user data')
      }

      const currentUser = currentUserResponse.data

      // Prepare update data
      const updateData: Record<string, any> = {}

      // Only update fields that have changed
      if (userData.firstName !== undefined || userData.lastName !== undefined) {
        const firstName = userData.firstName !== undefined ? userData.firstName : currentUser.name?.split(' ')[0] || ''
        const lastName = userData.lastName !== undefined ? userData.lastName : currentUser.name?.split(' ').slice(1).join(' ') || ''
        updateData.name = `${firstName} ${lastName}`.trim()
      }

      if (userData.email !== undefined) updateData.email = userData.email
      if (userData.username !== undefined) updateData.username = userData.username
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

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to update user')
      }

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

      if (userResponse.errors && userResponse.errors.length) {
        throw new Error(userResponse.errors[0].detail || 'User not found')
      }

      // Proceed with deletion
      const response = await daptinClient.jsonApi.destroy('user_account', id)

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to delete user')
      }

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
