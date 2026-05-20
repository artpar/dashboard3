import { DaptinClient } from 'daptin-client'

const configuredDaptinEndpoint =
  import.meta.env.VITE_DAPTIN_ENDPOINT || import.meta.env.VITE_DAPTIN_URL
const runtimeDaptinEndpoint =
  typeof window !== 'undefined' ? window.location.origin : ''

export const DAPTIN_ENDPOINT =
  configuredDaptinEndpoint || runtimeDaptinEndpoint

async function reloadToken(force = false) {
  if (daptinClient) {
    await daptinClient.worldManager.init()
    await daptinClient.worldManager.loadModels(force)
  }
  // const result = await daptinClient.aggregateClient
  //   .entity('user_account')
  //   .groupBy('date(created_at)')
  //   .count()
  //   .max('date(created_at)')
  //   .min('date(created_at)')
  //   .execute()

  // console.log('Total users:', result, JSON.stringify(result, null, 2));

  // return new Promise((resolve, reject) => {})
}

// Authentication functions
export async function signIn(
  username: string,
  password: string
): Promise<boolean> {
  try {
    const response = await daptinClient.actionManager.doAction(
      'user_account',
      'signin',
      {
        email: username,
        password: password,
      }
    )

    // The response is now an array of response objects with different ResponseTypes
    if (Array.isArray(response)) {
      // Process each response object
      for (const item of response) {
        if (
          item.ResponseType === 'client.store.set' &&
          item.Attributes.key === 'token'
        ) {
          // Store token in localStorage
          localStorage.setItem('token', item.Attributes.value)
        }
        // We don't need to handle the cookie.set here as the browser will do that automatically
      }

      // Check if we have a token to determine success
      return !!localStorage.getItem('token')
    } else if (response.responseType === 'success') {
      // Handle legacy response format for backward compatibility
      localStorage.setItem('token', response.token)
      return true
    }
    return false
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Sign in error:', error)
    return false
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<boolean> {
  try {
    const response = await daptinClient.actionManager.doAction(
      'user_account',
      'signup',
      {
        name,
        email,
        password,
      }
    )

    if (response.responseType === 'success') {
      // After signup, we can automatically sign in the user
      return await signIn(email, password)
    }
    return false
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Sign up error:', error)
    return false
  }
}

export function logout(): void {
  localStorage.removeItem('token')
  // Optionally reload the page or redirect to login
  window.location.href = '/'
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}

// Configure Axios with backward compatibility for paramsSerializer
const axiosConfig = {}

const daptinClient = new DaptinClient(
  DAPTIN_ENDPOINT,
  false,
  {
    getToken: function getToken() {
      return localStorage.getItem('token')
    },
  },
  axiosConfig
)
daptinClient.reloadToken = reloadToken
export { daptinClient }
