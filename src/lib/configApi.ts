import { DAPTIN_ENDPOINT } from '@/daptin'

/**
 * Config API Service for Daptin's /_config endpoint
 *
 * The _config API is separate from the JSON:API entity system.
 * All configs use configtype="backend"
 */

export interface ConfigEntry {
  key: string
  value: string
}

// Get the auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem('token')
}

// Build headers for API requests
function getHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Fetch all configuration values
 * Returns a flat object: { "key": "value", ... }
 */
export async function getAllConfig(): Promise<Record<string, string>> {
  const response = await fetch(`${DAPTIN_ENDPOINT}/_config`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get a specific configuration value
 * @param key - The config key (e.g., "jwt.secret", "gzip.enable")
 * @returns The raw string value
 */
export async function getConfig(key: string): Promise<string> {
  const response = await fetch(`${DAPTIN_ENDPOINT}/_config/backend/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch config '${key}': ${response.status} ${response.statusText}`)
  }

  return response.text()
}

/**
 * Set/update a configuration value
 * @param key - The config key
 * @param value - The new value (as string)
 */
export async function setConfig(key: string, value: string): Promise<void> {
  const response = await fetch(`${DAPTIN_ENDPOINT}/_config/backend/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: {
      ...getHeaders(),
      'Content-Type': 'text/plain',
    },
    body: value,
  })

  if (!response.ok) {
    throw new Error(`Failed to set config '${key}': ${response.status} ${response.statusText}`)
  }
}

/**
 * Create a new configuration value
 * @param key - The config key
 * @param value - The value
 */
export async function createConfig(key: string, value: string): Promise<void> {
  const response = await fetch(`${DAPTIN_ENDPOINT}/_config/backend/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'text/plain',
    },
    body: value,
  })

  if (!response.ok) {
    throw new Error(`Failed to create config '${key}': ${response.status} ${response.statusText}`)
  }
}

/**
 * Delete a configuration value
 * @param key - The config key to delete
 */
export async function deleteConfig(key: string): Promise<void> {
  const response = await fetch(`${DAPTIN_ENDPOINT}/_config/backend/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to delete config '${key}': ${response.status} ${response.statusText}`)
  }
}

// Export convenience object
export const configApi = {
  getAll: getAllConfig,
  get: getConfig,
  set: setConfig,
  create: createConfig,
  delete: deleteConfig,
}
