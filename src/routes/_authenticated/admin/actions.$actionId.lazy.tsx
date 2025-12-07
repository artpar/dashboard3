import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'
import { ActionExecuteComponent, ActionSchema } from '@/features/entity/components/actions/ActionExecuteComponent'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap, ArrowLeft, Play, Code, FileJson, Database, AlertCircle, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { Link } from '@tanstack/react-router'

interface ActionEntity {
  id: string
  reference_id: string
  action_name: string
  label: string
  world_id: string
  action_schema: string
  instance_optional: boolean
}

interface EntityInstance {
  id: string
  reference_id: string
  [key: string]: any
}

function ActionDetailPage() {
  const { actionId } = Route.useParams()
  const { toast } = useToast()
  const [actionResult, setActionResult] = useState<any>(null)
  const [showSchema, setShowSchema] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')

  // Fetch the action entity using findAll (findOne doesn't work reliably)
  const { data: actionEntity, isLoading: loadingEntity, error: entityError } = useQuery({
    queryKey: ['action-entity', actionId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('action', {})
      const actions = response.data as any[]
      const found = actions.find(
        (a) =>
          a.id === actionId ||
          a.reference_id === actionId ||
          a.attributes?.reference_id === actionId
      )
      if (found) {
        if (found.attributes) {
          return {
            id: found.id,
            reference_id: found.attributes.reference_id || found.id,
            ...found.attributes,
          } as ActionEntity
        }
        return found as ActionEntity
      }
      throw new Error('Action not found')
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

  // Fetch entity instances when action requires an instance (InstanceOptional = false)
  const requiresInstance = actionSchema && !actionSchema.InstanceOptional
  const targetEntityName = actionSchema?.OnType

  const { data: entityInstances = [], isLoading: loadingInstances, refetch: refetchInstances } = useQuery({
    queryKey: ['entity-instances-for-action', targetEntityName],
    queryFn: async () => {
      if (!targetEntityName) return []
      const response = await daptinClient.jsonApi.findAll(targetEntityName, {
        page: { number: 1, size: 100 }
      })
      const instances = response.data as any[]
      return instances.map(i => {
        if (i.attributes) {
          return { id: i.id, reference_id: i.attributes.reference_id || i.id, ...i.attributes }
        }
        return i
      }) as EntityInstance[]
    },
    enabled: !!targetEntityName && requiresInstance,
  })

  // Get display label for an instance
  const getInstanceLabel = (instance: EntityInstance): string => {
    // Try common name fields
    const nameFields = ['name', 'title', 'label', 'email', 'username', 'display_name']
    for (const field of nameFields) {
      if (instance[field]) {
        return `${instance[field]} (${instance.reference_id?.slice(0, 8)}...)`
      }
    }
    return instance.reference_id || instance.id
  }

  // Execute action mutation
  const executeMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      if (!actionSchema) throw new Error('Action schema not loaded')

      // If action requires an instance, add the reference_id
      if (requiresInstance && selectedInstanceId) {
        payload.reference_id = selectedInstanceId
      }

      return EntityApiService.executeAction(actionSchema.OnType, actionSchema.Name, payload)
    },
    onSuccess: (result) => {
      setActionResult(result)
      toast({ title: 'Action executed', description: `${actionSchema?.Label} completed successfully` })
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Execution failed', description: error?.message || 'Unknown error' })
    },
  })

  // Check if ready to execute
  const canExecute = useMemo(() => {
    if (!actionSchema) return false
    if (requiresInstance && !selectedInstanceId) return false
    return true
  }, [actionSchema, requiresInstance, selectedInstanceId])

  const isLoading = loadingEntity || loadingSchema

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (entityError || !actionEntity) {
    return (
      <div className="p-6 w-full">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Action not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link to="/admin/actions" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Actions
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6" />
              {actionSchema?.Label || actionEntity?.label || 'Action'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{actionSchema?.OnType || 'unknown'}</Badge>
              <Badge variant={actionSchema?.InstanceOptional ? 'secondary' : 'default'}>
                {actionSchema?.InstanceOptional ? 'Entity-level' : 'Instance-level'}
              </Badge>
              {actionSchema?.InFields && actionSchema.InFields.length > 0 && (
                <Badge variant="outline">{actionSchema.InFields.length} input{actionSchema.InFields.length !== 1 ? 's' : ''}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Instance Selection - Only show if action requires an instance */}
            {requiresInstance && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Select {actionSchema?.OnType} Instance
                  </CardTitle>
                  <CardDescription>
                    This action requires a specific {actionSchema?.OnType} instance to operate on
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedInstanceId}
                      onValueChange={setSelectedInstanceId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={`Select a ${actionSchema?.OnType} instance...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingInstances ? (
                          <SelectItem value="" disabled>Loading instances...</SelectItem>
                        ) : entityInstances.length > 0 ? (
                          entityInstances.map((instance) => (
                            <SelectItem key={instance.reference_id || instance.id} value={instance.reference_id || instance.id}>
                              {getInstanceLabel(instance)}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No {actionSchema?.OnType} instances found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => refetchInstances()}
                      disabled={loadingInstances}
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingInstances ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  {!selectedInstanceId && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Instance Required</AlertTitle>
                      <AlertDescription>
                        Please select an instance before executing this action
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedInstanceId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Instance selected: <code className="bg-muted px-1 rounded">{selectedInstanceId.slice(0, 8)}...</code>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Execute Form */}
            {actionSchema && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Execute Action
                  </CardTitle>
                  <CardDescription>
                    {actionSchema.InFields?.length > 0
                      ? 'Fill in the required fields and execute this action'
                      : 'This action has no input fields - click Execute to run it'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!canExecute && requiresInstance && (
                    <div className="mb-4 p-4 bg-muted rounded-lg text-center text-muted-foreground">
                      Select an instance above to enable execution
                    </div>
                  )}
                  <ActionExecuteComponent
                    actionSchema={actionSchema}
                    onExecute={(payload) => {
                      if (!canExecute) {
                        toast({ variant: 'destructive', title: 'Cannot execute', description: 'Please select an instance first' })
                        return Promise.reject(new Error('Instance required'))
                      }
                      return executeMutation.mutateAsync(payload)
                    }}
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Execution Result
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActionResult(null)}>
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96 font-mono">
                    {JSON.stringify(actionResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Action Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Action Name</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{actionSchema?.Name}</code>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entity</span>
                  <Badge variant="outline">{actionSchema?.OnType}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Instance Required</span>
                  <Badge variant={actionSchema?.InstanceOptional ? 'secondary' : 'default'}>
                    {actionSchema?.InstanceOptional ? 'No' : 'Yes'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Input Fields</span>
                  <span>{actionSchema?.InFields?.length || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Output Fields</span>
                  <span>{actionSchema?.OutFields?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Schema Viewer */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    Schema
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSchema(!showSchema)}>
                    <Code className="h-4 w-4" />
                    {showSchema ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CardHeader>
              {showSchema && (
                <CardContent>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                    {JSON.stringify(actionSchema, null, 2)}
                  </pre>
                </CardContent>
              )}
            </Card>

            {/* Input Fields Summary */}
            {actionSchema?.InFields && actionSchema.InFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Input Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {actionSchema.InFields.map((field) => (
                      <li key={field.ColumnName} className="flex justify-between text-sm items-center">
                        <div>
                          <span className="font-medium">{field.Name}</span>
                          {field.ColumnDescription && (
                            <p className="text-xs text-muted-foreground">{field.ColumnDescription}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs ml-2 shrink-0">{field.ColumnType}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/admin/actions/$actionId')({
  component: ActionDetailPage,
})
