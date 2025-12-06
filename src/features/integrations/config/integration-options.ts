import { Code, FileJson, Globe, Key, Lock, Shield, Webhook } from 'lucide-react'

export interface SpecificationLanguage {
  id: string
  label: string
  description: string
  icon: typeof Code
}

export interface SpecificationFormat {
  id: string
  label: string
  extension: string
}

export interface AuthenticationType {
  id: string
  label: string
  description: string
  icon: typeof Key
  fields: AuthField[]
}

export interface AuthField {
  name: string
  label: string
  type: 'text' | 'password' | 'textarea'
  placeholder?: string
  required?: boolean
}

export const SPECIFICATION_LANGUAGES: SpecificationLanguage[] = [
  {
    id: 'openapi3',
    label: 'OpenAPI 3.0',
    description: 'REST API specification using OpenAPI 3.0 standard',
    icon: Globe,
  },
  {
    id: 'openapi2',
    label: 'OpenAPI 2.0 (Swagger)',
    description: 'REST API specification using Swagger/OpenAPI 2.0',
    icon: Globe,
  },
  {
    id: 'graphql',
    label: 'GraphQL',
    description: 'GraphQL schema definition language',
    icon: Webhook,
  },
  {
    id: 'wsdl',
    label: 'WSDL',
    description: 'SOAP web service description language',
    icon: FileJson,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Custom integration specification format',
    icon: Code,
  },
]

export const SPECIFICATION_FORMATS: SpecificationFormat[] = [
  { id: 'json', label: 'JSON', extension: '.json' },
  { id: 'yaml', label: 'YAML', extension: '.yaml' },
  { id: 'xml', label: 'XML', extension: '.xml' },
]

export const AUTHENTICATION_TYPES: AuthenticationType[] = [
  {
    id: 'none',
    label: 'No Authentication',
    description: 'Public API with no authentication required',
    icon: Globe,
    fields: [],
  },
  {
    id: 'api_key',
    label: 'API Key',
    description: 'Authenticate using an API key in header or query parameter',
    icon: Key,
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true },
      { name: 'header_name', label: 'Header Name', type: 'text', placeholder: 'X-API-Key' },
      { name: 'key_location', label: 'Key Location', type: 'text', placeholder: 'header or query' },
    ],
  },
  {
    id: 'basic',
    label: 'Basic Auth',
    description: 'HTTP Basic Authentication with username and password',
    icon: Lock,
    fields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },
  {
    id: 'bearer',
    label: 'Bearer Token',
    description: 'Authenticate using a Bearer token in Authorization header',
    icon: Shield,
    fields: [
      { name: 'token', label: 'Bearer Token', type: 'password', required: true },
    ],
  },
  {
    id: 'oauth2',
    label: 'OAuth 2.0',
    description: 'OAuth 2.0 authentication flow',
    icon: Shield,
    fields: [
      { name: 'client_id', label: 'Client ID', type: 'text', required: true },
      { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { name: 'token_url', label: 'Token URL', type: 'text', required: true },
      { name: 'scope', label: 'Scope', type: 'text', placeholder: 'read write' },
    ],
  },
]

export function getSpecificationLanguageById(id: string): SpecificationLanguage | undefined {
  return SPECIFICATION_LANGUAGES.find((lang) => lang.id === id)
}

export function getAuthenticationTypeById(id: string): AuthenticationType | undefined {
  return AUTHENTICATION_TYPES.find((auth) => auth.id === id)
}
