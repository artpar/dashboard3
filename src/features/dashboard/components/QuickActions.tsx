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
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { daptinClient } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'

interface QuickAction {
  name: string
  icon: React.ReactNode
  path?: string
  action?: () => Promise<void>
  color: string
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

  // Define quick actions
  const quickActions: QuickAction[] = [
    {
      name: 'New User',
      icon: <Users className="h-6 w-6" />,
      path: '/create/user_account',
      color: 'text-blue-500',
    },
    {
      name: 'New Document',
      icon: <FileText className="h-6 w-6" />,
      path: '/create/document',
      color: 'text-green-500',
    },
    {
      name: 'New Task',
      icon: <ClipboardList className="h-6 w-6" />,
      path: '/create/task',
      color: 'text-purple-500',
    },
    {
      name: 'Export Data',
      icon: <Download className="h-6 w-6" />,
      action: async () => {
        await executeAction('world', 'export_data', {})
      },
      color: 'text-orange-500',
    },
    {
      name: 'Import Data',
      icon: <Upload className="h-6 w-6" />,
      path: '/world/actions/import_data',
      color: 'text-pink-500',
    },
    {
      name: 'Manage Entities',
      icon: <Database className="h-6 w-6" />,
      path: '/world',
      color: 'text-indigo-500',
    },
    {
      name: 'Mail Settings',
      icon: <Mail className="h-6 w-6" />,
      path: '/mail_server',
      color: 'text-cyan-500',
    },
    {
      name: 'System Settings',
      icon: <Settings className="h-6 w-6" />,
      path: '/settings/account',
      color: 'text-gray-500',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickActions.map((action) => (
            <Button
              key={action.name}
              variant="outline"
              className="flex h-24 flex-col space-y-2"
              onClick={() => handleActionClick(action)}
            >
              <div className={action.color}>{action.icon}</div>
              <span>{action.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
