import {
  Lock,
  Settings,
  Users,
  Gauge,
  Database,
  Server,
  type LucideIcon,
} from 'lucide-react'

/**
 * Configuration categories for organizing config keys
 */
export interface ConfigCategory {
  id: string
  label: string
  description: string
  icon: LucideIcon
  keys: string[]
}

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    id: 'authentication',
    label: 'JWT & Authentication',
    description: 'JWT tokens, TOTP, and authentication settings',
    icon: Lock,
    keys: ['jwt.secret', 'jwt.token.issuer', 'jwt.token.life.hours', 'totp.secret'],
  },
  {
    id: 'features',
    label: 'Features',
    description: 'Enable or disable optional features',
    icon: Settings,
    keys: ['graphql.enable', 'ftp.enable', 'imap.enabled', 'caldav.enable', 'gzip.enable', 'enable_https'],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    description: 'Yjs real-time collaboration settings',
    icon: Users,
    keys: ['yjs.enabled', 'yjs.storage.path', 'yjs.temp.path'],
  },
  {
    id: 'limits',
    label: 'Limits',
    description: 'Connection and rate limiting',
    icon: Gauge,
    keys: ['limit.max_connections', 'limit.rate'],
  },
  {
    id: 'storage',
    label: 'Storage & Encryption',
    description: 'Encryption keys and storage settings',
    icon: Database,
    keys: ['rclone.retries', 'encryption.secret'],
  },
  {
    id: 'server',
    label: 'Server',
    description: 'General server settings',
    icon: Server,
    keys: ['hostname', 'language.default'],
  },
]

/**
 * Value types for config keys
 * Used to determine how to render the editor for each config
 */
export type ConfigValueType = 'boolean' | 'number' | 'secret' | 'json' | 'string'

export const CONFIG_VALUE_TYPES: Record<string, ConfigValueType> = {
  // Boolean toggles
  'graphql.enable': 'boolean',
  'ftp.enable': 'boolean',
  'imap.enabled': 'boolean',
  'caldav.enable': 'boolean',
  'gzip.enable': 'boolean',
  'yjs.enabled': 'boolean',
  'enable_https': 'boolean',

  // Secrets (should be masked)
  'jwt.secret': 'secret',
  'totp.secret': 'secret',
  'encryption.secret': 'secret',

  // Numbers
  'jwt.token.life.hours': 'number',
  'limit.max_connections': 'number',
  'rclone.retries': 'number',

  // JSON
  'limit.rate': 'json',
}

/**
 * Human-readable descriptions for config keys
 */
export const CONFIG_DESCRIPTIONS: Record<string, string> = {
  'jwt.secret': 'Secret key used to sign JWT tokens',
  'jwt.token.issuer': 'JWT issuer identifier',
  'jwt.token.life.hours': 'Token validity period in hours',
  'totp.secret': 'Time-based one-time password secret for 2FA',
  'graphql.enable': 'Enable GraphQL API endpoint',
  'ftp.enable': 'Enable FTP server',
  'imap.enabled': 'Enable IMAP email server',
  'caldav.enable': 'Enable CalDAV calendar server',
  'gzip.enable': 'Enable gzip response compression',
  'enable_https': 'Enable HTTPS/TLS',
  'yjs.enabled': 'Enable Yjs real-time collaboration',
  'yjs.storage.path': 'Directory for Yjs document storage',
  'yjs.temp.path': 'Temporary directory for Yjs',
  'limit.max_connections': 'Maximum simultaneous connections',
  'limit.rate': 'Rate limiting configuration (JSON)',
  'rclone.retries': 'Number of retries for rclone operations',
  'encryption.secret': 'Master encryption key',
  'hostname': 'Server hostname',
  'language.default': 'Default language code',
}

/**
 * Get the value type for a config key
 * Defaults to 'string' if not explicitly defined
 */
export function getConfigValueType(key: string): ConfigValueType {
  // Check exact match first
  if (CONFIG_VALUE_TYPES[key]) {
    return CONFIG_VALUE_TYPES[key]
  }

  // Check for encryption keys pattern (per-user)
  if (key.startsWith('encryption.private_key.') || key.startsWith('encryption.public_key.')) {
    return 'secret'
  }

  return 'string'
}

/**
 * Get the description for a config key
 */
export function getConfigDescription(key: string): string {
  if (CONFIG_DESCRIPTIONS[key]) {
    return CONFIG_DESCRIPTIONS[key]
  }

  // Generate description for per-user encryption keys
  if (key.startsWith('encryption.private_key.')) {
    const email = key.replace('encryption.private_key.', '')
    return `Private encryption key for ${email}`
  }
  if (key.startsWith('encryption.public_key.')) {
    const email = key.replace('encryption.public_key.', '')
    return `Public encryption key for ${email}`
  }

  return ''
}

/**
 * Find which category a config key belongs to
 * Returns 'other' if not found in any category
 */
export function getCategoryForKey(key: string): string {
  for (const category of CONFIG_CATEGORIES) {
    if (category.keys.includes(key)) {
      return category.id
    }
  }

  // Per-user encryption keys go to storage
  if (key.startsWith('encryption.')) {
    return 'storage'
  }

  return 'other'
}

/**
 * Group configs by category
 */
export function groupConfigsByCategory(
  configs: Record<string, string>
): Map<string, Array<{ key: string; value: string }>> {
  const grouped = new Map<string, Array<{ key: string; value: string }>>()

  // Initialize all categories
  for (const category of CONFIG_CATEGORIES) {
    grouped.set(category.id, [])
  }
  grouped.set('other', [])

  // Group each config
  for (const [key, value] of Object.entries(configs)) {
    const categoryId = getCategoryForKey(key)
    const categoryConfigs = grouped.get(categoryId) || []
    categoryConfigs.push({ key, value })
    grouped.set(categoryId, categoryConfigs)
  }

  return grouped
}
