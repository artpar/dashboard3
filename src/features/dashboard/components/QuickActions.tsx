import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Settings,
  Database,
  Upload,
  Download,
  Users,
  Globe,
  Mail,
  Braces,
  History,
  Radio,
  RefreshCw,
  Layers,
  Cloud,
  Shield,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

interface QuickAction {
  name: string
  description?: string
  icon: React.ReactNode
  path?: string
  action?: () => Promise<void>
  color: string
  category?: 'data' | 'tools' | 'admin' | 'create'
}

export const QuickActions: React.FC = () => {
  const navigate = useNavigate()

  // Define quick actions grouped by category
  const toolActions: QuickAction[] = [
    {
      name: 'GraphQL',
      description: 'Auto-generated query API',
      icon: <Braces className="h-5 w-5" />,
      path: '/tools/graphql',
      color: 'text-pink-500',
      category: 'tools',
    },
    {
      name: 'Audit Logs',
      description: 'Change history with diffs',
      icon: <History className="h-5 w-5" />,
      path: '/tools/audit',
      color: 'text-amber-500',
      category: 'tools',
    },
    {
      name: 'WebSocket',
      description: 'Real-time event streams',
      icon: <Radio className="h-5 w-5" />,
      path: '/communication/websocket',
      color: 'text-green-500',
      category: 'tools',
    },
    {
      name: 'Config',
      description: 'System settings',
      icon: <Settings className="h-5 w-5" />,
      path: '/config',
      color: 'text-gray-500',
      category: 'tools',
    },
  ]

  const dataActions: QuickAction[] = [
    {
      name: 'Import',
      description: 'CSV, JSON, Excel, YAML',
      icon: <Upload className="h-5 w-5" />,
      path: '/data/import',
      color: 'text-blue-500',
      category: 'data',
    },
    {
      name: 'Export',
      description: 'CSV, JSON, Excel, PDF',
      icon: <Download className="h-5 w-5" />,
      path: '/data/export',
      color: 'text-orange-500',
      category: 'data',
    },
    {
      name: 'Exchanges',
      description: 'Sync with external systems',
      icon: <RefreshCw className="h-5 w-5" />,
      path: '/data/exchanges',
      color: 'text-purple-500',
      category: 'data',
    },
    {
      name: 'Streams',
      description: 'Transform pipelines',
      icon: <Layers className="h-5 w-5" />,
      path: '/data/streams',
      color: 'text-cyan-500',
      category: 'data',
    },
  ]

  const adminActions: QuickAction[] = [
    {
      name: 'Actions',
      description: 'Server-side workflows',
      icon: <Zap className="h-5 w-5" />,
      path: '/admin/actions',
      color: 'text-yellow-500',
      category: 'admin',
    },
    {
      name: 'Permissions',
      description: 'Table + row-level ACL',
      icon: <Shield className="h-5 w-5" />,
      path: '/admin/permissions',
      color: 'text-red-500',
      category: 'admin',
    },
    {
      name: 'Users',
      description: 'Accounts & groups',
      icon: <Users className="h-5 w-5" />,
      path: '/admin/users',
      color: 'text-blue-500',
      category: 'admin',
    },
    {
      name: 'Cloud Stores',
      description: 'S3, GCS, local, etc.',
      icon: <Cloud className="h-5 w-5" />,
      path: '/storage/cloud-stores',
      color: 'text-sky-500',
      category: 'admin',
    },
  ]

  const quickActions: QuickAction[] = [
    {
      name: 'New User',
      description: 'Create account',
      icon: <Users className="h-6 w-6" />,
      path: '/create/user_account',
      color: 'text-blue-500',
    },
    {
      name: 'Entities',
      description: 'All tables',
      icon: <Database className="h-6 w-6" />,
      path: '/world',
      color: 'text-indigo-500',
    },
    {
      name: 'Mail',
      description: 'SMTP/IMAP servers',
      icon: <Mail className="h-6 w-6" />,
      path: '/mail',
      color: 'text-cyan-500',
    },
    {
      name: 'Sites',
      description: 'Static hosting',
      icon: <Globe className="h-6 w-6" />,
      path: '/storage/sites',
      color: 'text-green-500',
    },
  ]

  // Handle action button click
  const handleActionClick = async (action: QuickAction) => {
    if (action.path) {
      navigate({ to: action.path })
    } else if (action.action) {
      try {
        await action.action()
      } catch (error) {
        console.error('Error executing action:', error)
      }
    }
  }

  const ActionButton = ({ action, compact = false }: { action: QuickAction; compact?: boolean }) => (
    <Button
      variant="outline"
      className={compact ? "flex h-16 flex-col justify-center gap-1 px-3" : "flex h-20 flex-col justify-center gap-1"}
      onClick={() => handleActionClick(action)}
    >
      <div className={action.color}>{action.icon}</div>
      <span className="text-xs font-medium">{action.name}</span>
      {action.description && !compact && (
        <span className="text-[10px] text-muted-foreground">{action.description}</span>
      )}
    </Button>
  )

  return (
    <div className="space-y-4">
      {/* Tools Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Developer Tools</CardTitle>
              <CardDescription>Query APIs, inspect changes, and monitor real-time events</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {toolActions.map((action) => (
              <ActionButton key={action.name} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Data Management</CardTitle>
          <CardDescription>Import/export data and configure bidirectional sync with external systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dataActions.map((action) => (
              <ActionButton key={action.name} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin & Quick Access */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Administration</CardTitle>
            <CardDescription>Manage users, access control, workflows, and storage backends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {adminActions.map((action) => (
                <ActionButton key={action.name} action={action} compact />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Access</CardTitle>
            <CardDescription>Jump to frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <ActionButton key={action.name} action={action} compact />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
