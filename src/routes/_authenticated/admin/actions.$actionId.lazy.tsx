import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'
import { ActionExecuteComponent, ActionSchema } from '@/features/entity/components/actions/ActionExecuteComponent'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Zap, ArrowLeft, Play, Code, FileJson } from 'lucide-react'
import { Link } from '@tanstack/react-router'

interface ActionEntity {
  reference_id: string
  action_name: string
  label: string
  world_id: string
  action_schema: string
  instance_optional: boolean
}

function ActionDetailPage() {
  const { actionId } = Route.useParams()
  const { toast } = useToast()
  const [actionResult, setActionResult] = useState<any>(null)
  const [showSchema, setShowSchema] = useState(false)

  // Fetch the action entity
  const { data: actionEntity, isLoading: loadingEntity } = useQuery({
    queryKey: ['action-entity', actionId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findOne('action', actionId, {})
      return response.data as ActionEntity
    },
  })

  // Fetch the action schema
  const { data: actionSchema, isLoading: loadingSchema } = useQuery({
    queryKey: ['action-schema', actionId],
    queryFn: async () => {
      const result = await EntityApiService.executeAction('action', 'get_action_schema', {
        action_id: actionId,
      })
      if (result && result[0]?.Attributes?.content) {
        return JSON.parse(atob(result[0].Attributes.content)) as ActionSchema
      }
      throw new Error('Failed to get action schema')
    },
    enabled: !!actionId,
  })

  // Execute action mutation
  const executeMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      if (!actionSchema) throw new Error('Action schema not loaded')
      return EntityApiService.executeAction(actionSchema.OnType, actionSchema.Name, payload)
    },
    onSuccess: (result) => {
      setActionResult(result)
      toast({ title: 'Action executed', description: `${actionSchema?.Label} completed successfully` })
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Execution failed', description: error.message })
    },
  })

  const isLoading = loadingEntity || loadingSchema

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/admin/actions" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Actions
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6" />
          {actionSchema?.Label || actionEntity?.label || 'Action'}
        </h1>
        <p className="text-muted-foreground">
          {actionSchema?.Name || actionEntity?.action_name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Action Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Action Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entity</span>
                <Badge variant="outline">{actionSchema?.OnType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Instance Required</span>
                <Badge variant={actionSchema?.InstanceOptional ? 'secondary' : 'default'}>
                  {actionSchema?.InstanceOptional ? 'No' : 'Yes'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Input Fields</span>
                <span>{actionSchema?.InFields?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output Fields</span>
                <span>{actionSchema?.OutFields?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Execute Form */}
          {actionSchema && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Execute Action
                </CardTitle>
                <CardDescription>
                  Fill in the required fields and execute this action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionExecuteComponent
                  actionSchema={actionSchema}
                  onExecute={(payload) => executeMutation.mutateAsync(payload)}
                  isLoading={executeMutation.isPending}
                  variant="compact"
                />
              </CardContent>
            </Card>
          )}

          {/* Action Result */}
          {actionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-64">
                  {JSON.stringify(actionResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Schema Viewer */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Schema
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowSchema(!showSchema)}>
                  <Code className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {showSchema && (
              <CardContent>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(actionSchema, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>

          {/* Input Fields */}
          {actionSchema?.InFields && actionSchema.InFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Input Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {actionSchema.InFields.map((field) => (
                    <li key={field.ColumnName} className="flex justify-between text-sm">
                      <span className="font-medium">{field.Name}</span>
                      <Badge variant="outline" className="text-xs">{field.ColumnType}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/admin/actions/$actionId')({
  component: ActionDetailPage,
})
