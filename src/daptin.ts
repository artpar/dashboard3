import { DaptinClient } from 'daptin-client'

export const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL
let TOKEN = localStorage.getItem('token')

// eslint-disable-next-line
let CUSTOMER: any = null
// eslint-disable-next-line
let USER: any = null

let daptinClient: DaptinClient

export async function reloadToken() {
  if (daptinClient) {
    await daptinClient.worldManager.init()
    await daptinClient.worldManager.loadModel('workgroup', false);
    await daptinClient.worldManager.loadModel('customer', false);
    await daptinClient.worldManager.loadModel('user_account', false);
    await daptinClient.worldManager.loadModel('usergroup', false);
    await daptinClient.worldManager.loadModel('world', false);
    await daptinClient.worldManager.loadModel('action', false);
  }
  // const result = await daptinClient.aggregateClient
  //   .entity('user_account')
  //   .groupBy('date(created_at)')
  //   .count()
  //   .max("date(created_at)")
  //   .min("date(created_at)")
  //   .execute();

  // console.log('Total users:', result[0].attributes.count);

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
          TOKEN = item.Attributes.value
        }
        // We don't need to handle the cookie.set here as the browser will do that automatically
      }

      // Check if we have a token to determine success
      return !!localStorage.getItem('token')
    } else if (response.responseType === 'success') {
      // Handle legacy response format for backward compatibility
      localStorage.setItem('token', response.token)
      TOKEN = response.token
      return true
    }
    return false
  } catch (error) {
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
    console.error('Sign up error:', error)
    return false
  }
}

export function logout(): void {
  localStorage.removeItem('token')
  TOKEN = null
  USER = null
  // Optionally reload the page or redirect to login
  window.location.href = '/'
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}

// Configure Axios with backward compatibility for paramsSerializer
const axiosConfig = {}

daptinClient = new DaptinClient(
  DAPTIN_ENDPOINT,
  false,
  {
    getToken: function getToken() {
      return localStorage.getItem('token')
    },
  },
  axiosConfig
)

export { daptinClient }
