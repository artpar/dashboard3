import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  FileText,
  Lightbulb,
  ClipboardList,
  Settings,
  Database,
  Upload,
  Download,
  Users,
  Server,
  Key,
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
import { daptinClient } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

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
  const { toast } = useToast()

  // Execute an action on an entity
  const executeAction = async (entityName: string, actionName: string, params = {}) => {
    try {
      const response = await daptinClient.actionManager.doAction(
        entityName,
        actionName,
        params
      )
      
      toast({
        title: 'Action executed',
        description: `Successfully executed ${actionName} on ${entityName}`,
      })
      
      return response
    } catch (error) {
      console.error(`Error executing ${actionName} on ${entityName}:`, error)
      toast({
        title: 'Action failed',
        description: `Failed to execute ${actionName} on ${entityName}`,
        variant: 'destructive',
      })
      throw error
    }
  }

  // Define quick actions grouped by category
  const toolActions: QuickAction[] = [
    {
      name: 'GraphQL',
      description: 'Query API interactively',
      icon: <Braces className="h-5 w-5" />,
      path: '/tools/graphql',
      color: 'text-pink-500',
      category: 'tools',
    },
    {
      name: 'Audit Logs',
      description: 'Track all changes',
      icon: <History className="h-5 w-5" />,
      path: '/tools/audit',
      color: 'text-amber-500',
      category: 'tools',
    },
    {
      name: 'WebSocket',
      description: 'Real-time events',
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
      description: 'Upload CSV/JSON data',
      icon: <Upload className="h-5 w-5" />,
      path: '/data/import',
      color: 'text-blue-500',
      category: 'data',
    },
    {
      name: 'Export',
      description: 'Download data',
      icon: <Download className="h-5 w-5" />,
      path: '/data/export',
      color: 'text-orange-500',
      category: 'data',
    },
    {
      name: 'Exchanges',
      description: 'Data sync config',
      icon: <RefreshCw className="h-5 w-5" />,
      path: '/data/exchanges',
      color: 'text-purple-500',
      category: 'data',
    },
    {
      name: 'Streams',
      description: 'Data pipelines',
      icon: <Layers className="h-5 w-5" />,
      path: '/data/streams',
      color: 'text-cyan-500',
      category: 'data',
    },
  ]

  const adminActions: QuickAction[] = [
    {
      name: 'Actions',
      description: 'Manage workflows',
      icon: <Zap className="h-5 w-5" />,
      path: '/admin/actions',
      color: 'text-yellow-500',
      category: 'admin',
    },
    {
      name: 'Permissions',
      description: 'Access control',
      icon: <Shield className="h-5 w-5" />,
      path: '/admin/permissions',
      color: 'text-red-500',
      category: 'admin',
    },
    {
      name: 'Users',
      description: 'Manage accounts',
      icon: <Users className="h-5 w-5" />,
      path: '/admin/users',
      color: 'text-blue-500',
      category: 'admin',
    },
    {
      name: 'Cloud Stores',
      description: 'File storage',
      icon: <Cloud className="h-5 w-5" />,
      path: '/storage/cloud-stores',
      color: 'text-sky-500',
      category: 'admin',
    },
  ]

  const quickActions: QuickAction[] = [
    {
      name: 'New User',
      icon: <Users className="h-6 w-6" />,
      path: '/create/user_account',
      color: 'text-blue-500',
    },
    {
      name: 'Entities',
      icon: <Database className="h-6 w-6" />,
      path: '/world',
      color: 'text-indigo-500',
    },
    {
      name: 'Mail',
      icon: <Mail className="h-6 w-6" />,
      path: '/communication/email',
      color: 'text-cyan-500',
    },
    {
      name: 'Sites',
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
              <CardDescription>API tools and monitoring</CardDescription>
            </div>
            <Badge variant="secondary">New</Badge>
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
          <CardDescription>Import, export, and sync data</CardDescription>
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
            <CardDescription>Users, permissions, storage</CardDescription>
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
            <CardDescription>Common operations</CardDescription>
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
