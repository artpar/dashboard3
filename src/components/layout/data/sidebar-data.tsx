import { useMemo } from 'react'
import {
  Command,
  LayoutDashboard,
  Zap,
  Shield,
  Users,
  UsersRound,
  GitBranch,
  Cloud,
  Globe,
  ShieldCheck,
  KeyRound,
  Mail,
  Radio,
  Upload,
  Download,
  RefreshCw,
  Layers,
  Plug,
  Code,
  ClipboardList,
  Settings,
} from 'lucide-react'
import { useWorldEntities } from '@/hooks/use-world-entities.tsx'
import { type SidebarData } from '../types'

// Static user and team data
const userData = {
  name: 'satnaing',
  email: 'satnaingdev@gmail.com',
  avatar: '/avatars/shadcn.jpg',
}

const teamsData = [
  {
    name: 'Daptin',
    logo: Command,
    plan: '',
  },
]

// Admin section items
const adminItems = [
  { title: 'Actions', url: '/admin/actions', icon: Zap, description: 'Server-side workflows beyond CRUD — send emails, call APIs, manage files' },
  { title: 'Permissions', url: '/admin/permissions', icon: Shield, description: 'Table and row-level access control for guests, owners, and groups' },
  { title: 'Users', url: '/admin/users', icon: Users, description: 'User accounts with JWT authentication and group membership' },
  { title: 'Groups', url: '/admin/groups', icon: UsersRound, description: 'User groups for bulk permission assignment' },
  { title: 'State Machines', url: '/admin/state-machines', icon: GitBranch, description: 'Define valid state transitions for record lifecycles' },
]

// Storage section items
const storageItems = [
  { title: 'Cloud Stores', url: '/storage/cloud-stores', icon: Cloud, description: 'Storage backends — S3, GCS, Azure, local filesystem, and more' },
  { title: 'Sites', url: '/storage/sites', icon: Globe, description: 'Static sites served from cloud storage with domain routing' },
  { title: 'Certificates', url: '/storage/certificates', icon: ShieldCheck, description: 'SSL/TLS certificates for HTTPS and DKIM signing' },
]

// Communication section items
const communicationItems = [
  { title: 'OAuth', url: '/communication/oauth', icon: KeyRound, description: 'OAuth 2.0 provider configs for social login and API access' },
  { title: 'Email', url: '/communication/email', icon: Mail, description: 'SMTP/IMAP server configurations for sending and receiving mail' },
  { title: 'WebSocket', url: '/communication/websocket', icon: Radio, description: 'Real-time event streaming over WebSocket connections' },
]

// Data section items
const dataItems = [
  { title: 'Import', url: '/data/import', icon: Upload, description: 'Import data from CSV, JSON, Excel, and other formats' },
  { title: 'Export', url: '/data/export', icon: Download, description: 'Export entity data to CSV, JSON, Excel, PDF, or HTML' },
  { title: 'Exchanges', url: '/data/exchanges', icon: RefreshCw, description: 'Bidirectional sync between entities and external systems' },
  { title: 'Streams', url: '/data/streams', icon: Layers, description: 'Data transformation pipelines for processing records' },
  { title: 'Integrations', url: '/data/integrations', icon: Plug, description: 'Connect external APIs via OpenAPI specs — each operation becomes an action' },
]

// Tools section items
const toolsItems = [
  { title: 'GraphQL', url: '/tools/graphql', icon: Code, description: 'Query and mutate entities using the auto-generated GraphQL API' },
  { title: 'Audit Logs', url: '/tools/audit', icon: ClipboardList, description: 'Track all data changes with user, timestamp, and before/after values' },
]

// Entities that have dedicated pages in other sections - exclude from Entities list
const excludedEntities = new Set([
  // Admin section
  'action',
  'usergroup',
  'user_account',
  'user_otp_account',
  'smd',
  // Storage section
  'cloud_store',
  'site',
  'certificate',
  // Communication section
  'oauth_connect',
  'oauth_token',
  'mail',
  'mail_account',
  'mail_box',
  'mail_server',
  'outbox',
  // Data section
  'data_exchange',
  'stream',
  'integration',
])

// Custom hook to generate sidebar data from world entities
export function useSidebarData(): SidebarData {
  const { groupedEntities, isLoading } = useWorldEntities()

  return useMemo(() => {
    // Default items that are always present
    const defaultItems = [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
    ]

    // Create nav items from top-level entities, excluding those with dedicated sections
    const entityItems = isLoading
      ? []
      : groupedEntities.topLevel
          .filter((entity) => !excludedEntities.has(entity.table_name))
          .map((entity) => ({
            title: entity.table_name,
            url: `/${entity.table_name}`,
            icon: entity.icon,
          }))

    return {
      user: userData,
      teams: teamsData,
      navGroups: [
        {
          title: 'General',
          items: defaultItems,
        },
        {
          title: 'Admin',
          items: adminItems,
        },
        {
          title: 'Storage',
          items: storageItems,
        },
        {
          title: 'Communication',
          items: communicationItems,
        },
        {
          title: 'Data',
          items: dataItems,
        },
        {
          title: 'Tools',
          items: toolsItems,
        },
        {
          title: 'Settings',
          items: [
            { title: 'Config', url: '/config', icon: Settings },
          ],
        },
        {
          title: 'Entities',
          items: entityItems,
        },
      ],
    }
  }, [groupedEntities, isLoading])
}
