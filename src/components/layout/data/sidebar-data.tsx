import { useMemo } from 'react'
import {
  Activity,
  Boxes,
  Cloud,
  Code,
  Database,
  Download,
  FileText,
  Gauge,
  GitBranch,
  Globe,
  KeyRound,
  Layers,
  LockKeyhole,
  Mail,
  Plug,
  Radio,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Table2,
  Upload,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react'
import { useWorldEntities } from '@/hooks/use-world-entities.tsx'
import { type NavItem, type SidebarData } from '../types'

const userData = {
  name: 'Daptin user',
  email: '',
  avatar: '/avatars/shadcn.jpg',
}

const teamsData = [
  {
    name: 'Daptin',
    logo: Database,
    plan: '',
  },
]

const dataItems: NavItem[] = [
  {
    title: 'Tables',
    url: '/data',
    icon: Table2,
    description: 'Browse app data tables without using raw entity routes',
  },
  {
    title: 'Import',
    url: '/data/import',
    icon: Upload,
    description: 'Import data into a selected Daptin entity',
  },
  {
    title: 'Export',
    url: '/data/export',
    icon: Download,
    description: 'Export Daptin entity data with selected filters and format',
  },
]

const accessItems: NavItem[] = [
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
    description: 'User accounts, authentication state, and group membership',
  },
  {
    title: 'Groups',
    url: '/admin/groups',
    icon: UsersRound,
    description: 'User groups used for Daptin permission assignment',
  },
  {
    title: 'Permissions',
    url: '/admin/permissions',
    icon: Shield,
    description: 'Entity permission matrix from Daptin world metadata',
  },
]

const fileSiteItems: NavItem[] = [
  {
    title: 'Cloud Stores',
    url: '/storage/cloud-stores',
    icon: Cloud,
    description: 'Storage backends used by files, documents, and sites',
  },
  {
    title: 'Sites',
    url: '/storage/sites',
    icon: Globe,
    description: 'Hosted sites backed by Daptin storage primitives',
  },
  {
    title: 'Certificates',
    url: '/storage/certificates',
    icon: ShieldCheck,
    description: 'TLS certificates and DKIM records for hosted services',
  },
]

const mailItems: NavItem[] = [
  {
    title: 'Overview',
    url: '/mail',
    icon: Mail,
    description: 'Native SMTP and IMAP readiness for this Daptin server',
  },
  {
    title: 'Servers',
    url: '/mail/servers',
    icon: Mail,
    description: 'Native Daptin SMTP listener rows',
  },
  {
    title: 'Accounts',
    url: '/mail/accounts',
    icon: Mail,
    description: 'Mail accounts linked to native Daptin mail servers',
  },
  {
    title: 'Outbox',
    url: '/mail/outbox',
    icon: Send,
    description: 'Queued and failed Daptin outbox messages',
  },
]

const workflowItems: NavItem[] = [
  {
    title: 'Actions',
    url: '/admin/actions',
    icon: Zap,
    description: 'Daptin server-side actions and operational workflows',
  },
  {
    title: 'State Machines',
    url: '/admin/state-machines',
    icon: GitBranch,
    description: 'State transition rules for records and workflows',
  },
  {
    title: 'Templates',
    url: '/templates',
    icon: FileText,
    description: 'Reusable response and site templates stored in Daptin',
  },
  {
    title: 'Exchanges',
    url: '/data/exchanges',
    icon: Layers,
    description: 'Bidirectional sync between Daptin entities and systems',
  },
  {
    title: 'Streams',
    url: '/data/streams',
    icon: Boxes,
    description: 'Data transformation pipelines for Daptin records',
  },
]

const advancedItems: NavItem[] = [
  {
    title: 'GraphQL',
    url: '/tools/graphql',
    icon: Code,
    description: 'Use the Daptin GraphQL endpoint for advanced querying',
  },
  {
    title: 'Realtime',
    url: '/communication/websocket',
    icon: Radio,
    description: 'Inspect live and websocket behavior for this Daptin server',
  },
]

export function useSidebarData(): SidebarData {
  const { groupedEntities, isLoading } = useWorldEntities()

  return useMemo(() => {
    const rawEntityItems: NavItem[] = isLoading
      ? []
      : groupedEntities.topLevel.map((entity) => ({
          title: entity.table_name,
          url: `/${entity.table_name}`,
          icon: entity.icon || 'table',
          description: `Raw fallback browser for ${entity.table_name}`,
        }))

    return {
      user: userData,
      teams: teamsData,
      navGroups: [
        {
          title: 'Daptin Console',
          items: [
            {
              title: 'Overview',
              url: '/',
              icon: Gauge,
              description: 'Connection, setup, and operational status',
            },
            {
              title: 'Data',
              icon: Database,
              description: 'App data browsing, import, and export workflows',
              items: dataItems,
            },
            {
              title: 'Users & Access',
              icon: LockKeyhole,
              description: 'Users, groups, and Daptin permissions',
              items: accessItems,
            },
            {
              title: 'Files & Sites',
              icon: Cloud,
              description: 'Storage backends, hosted sites, and certificates',
              items: fileSiteItems,
            },
            {
              title: 'Mail',
              icon: Mail,
              description: 'Mail servers and message delivery configuration',
              items: mailItems,
            },
            {
              title: 'Integrations',
              url: '/data/integrations',
              icon: Plug,
              description: 'External APIs imported into Daptin actions',
            },
            {
              title: 'OAuth',
              url: '/communication/oauth',
              icon: KeyRound,
              description: 'OAuth provider configuration for Daptin auth',
            },
            {
              title: 'Workflows',
              icon: Zap,
              description: 'Actions, state machines, templates, exchanges, and streams',
              items: workflowItems,
            },
            {
              title: 'Config',
              url: '/config',
              icon: Settings,
              description: 'Daptin configuration values and runtime settings',
            },
            {
              title: 'Activity',
              url: '/tools/audit',
              icon: Activity,
              description: 'Audit trail and operational history',
            },
            {
              title: 'Advanced',
              icon: Code,
              description: 'GraphQL and realtime diagnostic tools',
              items: advancedItems,
            },
            {
              title: 'Raw Entities',
              icon: Table2,
              description: 'Fallback generated entity browser',
              items: rawEntityItems,
            },
          ],
        },
      ],
    }
  }, [groupedEntities, isLoading])
}
